import { NextRequest, NextResponse } from 'next/server';
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

    // 1. Verify Webhook Signature against Raw Body
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('Rejected Razorpay webhook: Invalid cryptographic signature.');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || event.id || `evt_${Date.now()}`;
    const eventType = event.event;

    // 2. Idempotency Check (Prevent duplicate webhook execution)
    if (isWebhookEventProcessed(eventId)) {
      console.log(`Duplicate webhook event ${eventId} safely ignored.`);
      return NextResponse.json({
        received: true,
        message: 'Duplicate event already processed',
      });
    }

    recordWebhookEvent({
      id: `whe-${Date.now()}`,
      eventId,
      eventType,
      payload: event,
      processedAt: new Date().toISOString(),
      status: 'processed',
    });

    // 3. Process Event Types
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      const amountPaid = paymentEntity?.amount; // in paise
      const currency = paymentEntity?.currency || 'INR';

      if (rzpOrderId) {
        const order = getServerOrderByRazorpayOrderId(rzpOrderId);
        if (order) {
          // Verify expected amount in paise matches
          const expectedPaise = Math.round(order.total * 100);
          if (amountPaid && amountPaid < expectedPaise) {
            console.error(
              `Payment amount mismatch for order ${order.id}: expected ${expectedPaise}, received ${amountPaid}`
            );
            return NextResponse.json(
              { error: 'Underpaid amount detected' },
              { status: 400 }
            );
          }

          if (currency !== 'INR') {
            console.warn(`Unexpected currency ${currency} for order ${order.id}`);
          }

          // Atomic update: Set payment status to paid, order status to accepted
          updateServerOrderStatus(order.id, 'paid', 'accepted', paymentId);
          console.log(`Webhook confirmed payment for Order ${order.id} (#${order.orderCode})`);
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      if (rzpOrderId) {
        const order = getServerOrderByRazorpayOrderId(rzpOrderId);
        if (order) {
          updateServerOrderStatus(order.id, 'failed');
          console.log(`Webhook marked payment failed for Order ${order.id}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook processing exception:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
