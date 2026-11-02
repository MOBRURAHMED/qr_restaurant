import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  getServerOrderById,
  updateServerOrderStatus,
  getServerPaymentSettings
} from '@/lib/server-data';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing payment signature verification parameters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    let restaurantId = '';

    if (supabase) {
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (dbOrder) {
        restaurantId = dbOrder.restaurant_id;

        // Fetch restaurant-specific secret if owner configured custom gateway
        const { data: dbSettings } = await supabase
          .from('restaurant_payment_settings')
          .select('razorpay_key_secret')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        const customSecret = dbSettings?.razorpay_key_secret;

        const isValid = verifyPaymentSignature({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          keySecret: customSecret || undefined,
        });

        if (isValid) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'accepted',
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          // Insert into payments ledger
          await supabase.from('payments').insert({
            order_id: orderId,
            restaurant_id: restaurantId,
            amount: dbOrder.total,
            currency: 'INR',
            method: 'online_card',
            status: 'paid',
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            verified_at: new Date().toISOString(),
          });

          // Mirror memory
          updateServerOrderStatus(orderId, 'paid');
          const memOrder = getServerOrderById(orderId);
          if (memOrder) {
            memOrder.status = 'accepted';
            memOrder.paymentStatus = 'paid';
          }

          return NextResponse.json({
            success: true,
            verified: true,
            message: 'Signature verified and payment marked as paid in Supabase',
          });
        }
      }
    }

    const order = getServerOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: `Order with ID "${orderId}" not found` },
        { status: 404 }
      );
    }

    // Cryptographically verify signature with fallback memory settings
    const settings = getServerPaymentSettings(order.restaurantId);
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      keySecret: settings.razorpayKeySecret || undefined,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Cryptographic signature verification failed. Untrusted payment payload.' },
        { status: 400 }
      );
    }

    order.paymentStatus = 'paid';
    order.status = 'accepted';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    updateServerOrderStatus(order.id, 'paid');

    return NextResponse.json({
      success: true,
      verified: true,
      order,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
