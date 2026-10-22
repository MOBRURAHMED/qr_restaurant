import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getServerRestaurant,
  getServerPaymentSettings,
  validateAndCalculateServerOrder,
  saveServerOrder,
  lookupTableByToken,
  getNextServerOrderSerial,
  getServerOrdersByRestaurant
} from '@/lib/server-data';
import { createRazorpayOrder, getRazorpayKeyId } from '@/lib/razorpay';
import { Order, PaymentMethod } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      restaurantId,
      tableNumber,
      tableToken,
      paymentMethod,
      items,
      tip,
      customerName,
      customerPhone,
      specialInstructions,
      idempotencyKey,
      customerSessionId,
    } = body;

    if (!restaurantId || !tableNumber || !paymentMethod || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, tableNumber, paymentMethod, items' },
        { status: 400 }
      );
    }

    // Table Token Validation (if passed)
    if (tableToken) {
      const verifiedTable = lookupTableByToken(tableToken);
      if (!verifiedTable || verifiedTable.restaurant.id !== restaurantId) {
        return NextResponse.json(
          { error: 'Invalid or expired dining table QR token' },
          { status: 403 }
        );
      }
    }

    const restaurant = getServerRestaurant(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { error: `Restaurant with ID "${restaurantId}" not found.` },
        { status: 404 }
      );
    }

    // 1. Authoritative Restaurant Payment Settings Check
    const settings = getServerPaymentSettings(restaurantId);

    // Verify all-disabled state
    const anyMethodEnabled =
      settings.upiQrEnabled ||
      settings.upiAppEnabled ||
      settings.cardEnabled ||
      settings.counterPaymentEnabled;

    if (!anyMethodEnabled) {
      return NextResponse.json(
        {
          error: 'This restaurant currently has no payment options enabled. Please contact staff directly.',
          code: 'NO_PAYMENT_METHODS_AVAILABLE',
        },
        { status: 400 }
      );
    }

    // Verify specific requested method
    const normalizedMethod = paymentMethod as PaymentMethod;
    if (
      (normalizedMethod === 'upi_qr' && !settings.upiQrEnabled) ||
      (normalizedMethod === 'upi_app' && !settings.upiAppEnabled) ||
      (normalizedMethod === 'online_upi' && !settings.upiAppEnabled && !settings.upiQrEnabled) ||
      (normalizedMethod === 'card' && !settings.cardEnabled) ||
      (normalizedMethod === 'online_card' && !settings.cardEnabled) ||
      (normalizedMethod === 'counter' && !settings.counterPaymentEnabled)
    ) {
      return NextResponse.json(
        {
          error: `Payment method "${normalizedMethod}" is currently disabled by the restaurant.`,
          code: 'PAYMENT_METHOD_DISABLED',
        },
        { status: 400 }
      );
    }

    // 2. Authoritative Price Validation & Recalculation
    const calculation = validateAndCalculateServerOrder(restaurantId, items, tip || 0);

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const orderCode = getNextServerOrderSerial(restaurantId);
    const trackingToken = `trk_${crypto.randomBytes(24).toString('hex')}`;

    // Determine round number for this customer session at this table
    const existingSessionOrders = customerSessionId
      ? getServerOrdersByRestaurant(restaurantId).filter(
          (o) => o.tableNumber === String(tableNumber) && o.customerSessionId === customerSessionId
        )
      : [];
    const roundNumber = existingSessionOrders.length + 1;

    const orderItems = calculation.verifiedItems.map((vi, idx) => ({
      id: `oi-${Date.now()}-${idx}`,
      menuItemId: vi.menuItemId,
      name: vi.name,
      price: vi.price, // Immutable unit price snapshot
      quantity: vi.quantity,
      isVeg: vi.isVeg,
      notes: vi.notes,
    }));

    // 3. Razorpay Order Creation for Online Methods
    const isOnlineRazorpay =
      normalizedMethod === 'upi_app' ||
      normalizedMethod === 'card' ||
      normalizedMethod === 'online_upi' ||
      normalizedMethod === 'online_card';

    let razorpayData = null;

    if (isOnlineRazorpay) {
      const amountInPaise = Math.round(calculation.total * 100);
      const rzpOrder = await createRazorpayOrder({
        amountInPaise,
        currency: 'INR',
        receipt: orderCode,
        notes: {
          orderId,
          restaurantId,
          tableNumber: String(tableNumber),
        },
        keyId: settings.razorpayKeyId,
        accountNumber: settings.razorpayConnectedAccountId,
      });

      razorpayData = {
        orderId: rzpOrder.id,
        keyId: getRazorpayKeyId(settings.razorpayKeyId),
        amountInPaise: rzpOrder.amount,
        currency: rzpOrder.currency,
      };
    }

    // 4. Create and Persist Internal Order with Idempotency Protection
    const newOrder: Order = {
      id: orderId,
      restaurantId,
      tableNumber: String(tableNumber),
      orderCode,
      trackingToken,
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
      customerName: customerName ? String(customerName) : undefined,
      customerPhone: customerPhone ? String(customerPhone) : undefined,
      specialInstructions: specialInstructions ? String(specialInstructions) : undefined,
      items: orderItems,
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      tip: calculation.tip,
      total: calculation.total,
      status: 'new',
      paymentStatus: normalizedMethod === 'counter' ? 'unpaid' : 'pending',
      paymentMethod: normalizedMethod,
      razorpayOrderId: razorpayData?.orderId,
      customerSessionId: customerSessionId ? String(customerSessionId) : undefined,
      roundNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = saveServerOrder(newOrder, idempotencyKey);

    return NextResponse.json({
      success: true,
      order: saved.order,
      isDuplicate: saved.isDuplicate,
      trackingToken: saved.order.trackingToken,
      razorpay: razorpayData,
      upiQr: normalizedMethod === 'upi_qr'
        ? {
            upiId: settings.upiId || 'merchant@okhdfcbank',
            payeeName: settings.payeeName || restaurant.name,
            amount: calculation.total,
            orderCode,
            qrImagePath: settings.upiQrImagePath,
            instructions: 'Please enter this exact amount and order reference when making payment. Staff will verify before preparation.',
          }
        : null,
      counter: normalizedMethod === 'counter'
        ? {
            instructions: 'Order submitted to kitchen. Please pay at the counter when you finish your meal.',
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('Server order validation error:', error);
    const message = error instanceof Error ? error.message : 'Internal order calculation failure';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
