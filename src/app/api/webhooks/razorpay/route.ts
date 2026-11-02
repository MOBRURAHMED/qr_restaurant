import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import {
  isWebhookEventProcessed,
  recordWebhookEvent,
  getServerOrderByRazorpayOrderId,
  updateServerOrderStatus
} from '@/lib/server-data';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || event.id || `evt_${Date.now()}`;
    const eventType = event.event;

    const supabase = getSupabaseServerClient();

    // 1. Check idempotency in Supabase or memory
    if (supabase) {
      const { data: existingEvent } = await supabase
        .from('payment_webhook_events')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEvent) {
        return NextResponse.json({
          received: true,
          message: 'Duplicate event already processed',
        });
      }
    } else if (isWebhookEventProcessed(eventId)) {
      return NextResponse.json({
        received: true,
        message: 'Duplicate event already processed',
      });
    }

    // 2. Cryptographic signature check
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Rejected Razorpay webhook: Invalid cryptographic signature.');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // 3. Record event in webhook audit log
    if (supabase) {
      await supabase.from('payment_webhook_events').insert({
        event_id: eventId,
        event_type: eventType,
        payload: event,
        status: 'processed',
        processed_at: new Date().toISOString(),
      });
    }

    recordWebhookEvent({
      id: `whe-${Date.now()}`,
      eventId,
      eventType,
      status: 'processed',
      payload: event,
      processedAt: new Date().toISOString(),
    });

    // 4. Update order when payment succeeds
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        if (supabase) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'accepted',
              razorpay_payment_id: razorpayPaymentId,
              updated_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', razorpayOrderId);
        }

        const internalOrder = getServerOrderByRazorpayOrderId(razorpayOrderId);
        if (internalOrder) {
          internalOrder.paymentStatus = 'paid';
          if (razorpayPaymentId) internalOrder.razorpayPaymentId = razorpayPaymentId;
          updateServerOrderStatus(internalOrder.id, 'paid');
        }
      }
    }

    return NextResponse.json({
      received: true,
      event: eventType,
      status: 'success',
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
