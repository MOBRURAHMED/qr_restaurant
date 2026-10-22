import { NextRequest, NextResponse } from 'next/server';
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

    const order = getServerOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: `Order with ID "${orderId}" not found` },
        { status: 404 }
      );
    }

    // Verify associated Razorpay order ID matches the internal record
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: 'Mismatched Razorpay Order ID. Possible tampering detected.' },
        { status: 400 }
      );
    }

    // Cryptographically verify signature
    const settings = getServerPaymentSettings(order.restaurantId);
    const isValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      console.error(`Invalid payment signature for order ${orderId}: ${razorpayPaymentId}`);
      updateServerOrderStatus(orderId, 'failed');
      return NextResponse.json(
        { error: 'Payment signature verification failed. Untrusted confirmation.' },
        { status: 400 }
      );
    }

    // Mark as paid and accepted
    const updatedOrder = updateServerOrderStatus(
      orderId,
      'paid',
      'accepted',
      razorpayPaymentId
    );

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully and order dispatched to kitchen.',
      order: updatedOrder,
    });
  } catch (error: unknown) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
