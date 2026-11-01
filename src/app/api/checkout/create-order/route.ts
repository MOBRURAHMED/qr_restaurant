import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  validateAndCalculateServerOrder,
  saveServerOrder,
  lookupTableByToken,
  getNextServerOrderSerial,
} from '@/lib/server-data';
import { createRazorpayOrder, getRazorpayKeyId } from '@/lib/razorpay';
import { Order, PaymentMethod, OrderItem } from '@/types';

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

    const supabase = getSupabaseServerClient();

    // 1. Table Token Validation (if passed)
    if (tableToken) {
      if (supabase) {
        const { data: tableData } = await supabase
          .from('dining_tables')
          .select('id, restaurant_id, table_number')
          .eq('qr_token', tableToken)
          .maybeSingle();

        if (tableData && tableData.restaurant_id !== restaurantId) {
          return NextResponse.json(
            { error: 'Invalid or expired dining table QR token' },
            { status: 403 }
          );
        }
      } else {
        const verifiedTable = lookupTableByToken(tableToken);
        if (!verifiedTable || verifiedTable.restaurant.id !== restaurantId) {
          return NextResponse.json(
            { error: 'Invalid or expired dining table QR token' },
            { status: 403 }
          );
        }
      }
    }

    // 2. Authoritative Price Validation & Recalculation
    const calculation = validateAndCalculateServerOrder(restaurantId, items, tip || 0);

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const trackingToken = crypto.randomBytes(24).toString('hex');
    const serial = getNextServerOrderSerial(restaurantId);
    const orderCode = `#SG-${serial}`;

    // Construct OrderItem format
    const orderItems: OrderItem[] = calculation.verifiedItems.map((vi, index) => ({
      id: `item-${Date.now()}-${index}`,
      menuItemId: vi.menuItemId,
      name: vi.name,
      price: vi.price,
      quantity: vi.quantity,
      isVeg: vi.isVeg,
      notes: vi.notes,
    }));

    const newOrder: Order = {
      id: orderId,
      restaurantId,
      tableNumber: String(tableNumber),
      orderCode,
      trackingToken,
      idempotencyKey: idempotencyKey || undefined,
      customerSessionId: customerSessionId || undefined,
      customerName: customerName ? String(customerName).trim() : 'Guest',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      specialInstructions: specialInstructions ? String(specialInstructions).trim() : '',
      items: orderItems,
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      tip: calculation.tip,
      total: calculation.total,
      status: 'pending',
      paymentStatus: paymentMethod === 'counter' ? 'unpaid' : 'pending',
      paymentMethod: paymentMethod as PaymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Persist to Supabase if available
    if (supabase) {
      const { data: insertedOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          restaurant_id: restaurantId,
          table_number: String(tableNumber),
          order_code: orderCode,
          tracking_token: trackingToken,
          idempotency_key: idempotencyKey || null,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          special_instructions: newOrder.specialInstructions,
          subtotal: newOrder.subtotal,
          tax: newOrder.tax,
          tip: newOrder.tip,
          total: newOrder.total,
          status: 'new',
          payment_status: newOrder.paymentStatus,
          payment_method: newOrder.paymentMethod,
        })
        .select()
        .single();

      if (!orderErr && insertedOrder) {
        const orderItemsToInsert = calculation.verifiedItems.map((vi) => ({
          order_id: orderId,
          menu_item_id: vi.menuItemId,
          name: vi.name,
          price: vi.price,
          quantity: vi.quantity,
          is_veg: vi.isVeg,
          notes: vi.notes || null,
        }));

        await supabase.from('order_items').insert(orderItemsToInsert);
      }
    }

    // Always mirror to memory store to preserve existing real-time listeners and unit tests
    saveServerOrder(newOrder);

    // 4. Handle Razorpay gateway order creation if online payment
    let razorpayOrderData = null;
    if (paymentMethod === 'online_upi' || paymentMethod === 'card' || paymentMethod === 'online_card') {
      try {
        const rzp = await createRazorpayOrder({
          amountInPaise: newOrder.total * 100,
          currency: 'INR',
          receipt: newOrder.orderCode,
          notes: {
            orderId: newOrder.id,
            restaurantId: newOrder.restaurantId,
            tableNumber: newOrder.tableNumber,
          },
        });
        razorpayOrderData = {
          orderId: rzp.id,
          amount: rzp.amount,
          currency: rzp.currency,
          keyId: getRazorpayKeyId(),
        };
      } catch (e) {
        console.warn('Razorpay order creation fallback:', (e as Error).message);
      }
    }

    return NextResponse.json(
      {
        order: newOrder,
        razorpay: razorpayOrderData,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
