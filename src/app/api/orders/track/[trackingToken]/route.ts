import { NextRequest, NextResponse } from 'next/server';
import { getServerOrderByTrackingToken, getServerRestaurant } from '@/lib/server-data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingToken: string }> }
) {
  try {
    const { trackingToken } = await params;
    if (!trackingToken) {
      return NextResponse.json({ error: 'Tracking token is required' }, { status: 400 });
    }

    const order = getServerOrderByTrackingToken(trackingToken);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found for this tracking token' },
        { status: 404 }
      );
    }

    const restaurant = getServerRestaurant(order.restaurantId);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        tableNumber: order.tableNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        tip: order.tip,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      restaurant: {
        name: restaurant?.name || 'Restaurant',
        slug: restaurant?.slug || '',
        currency: restaurant?.currency || '₹',
        address: restaurant?.address || '',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order tracking lookup failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
