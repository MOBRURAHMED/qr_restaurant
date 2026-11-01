import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerOrderByTrackingToken, getServerRestaurant } from '@/lib/server-data';
import { OrderItem } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingToken: string }> }
) {
  try {
    const { trackingToken } = await params;
    if (!trackingToken) {
      return NextResponse.json({ error: 'Tracking token is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('tracking_token', trackingToken)
        .maybeSingle();

      if (!orderErr && dbOrder) {
        // Fetch restaurant details
        const { data: dbRest } = await supabase
          .from('restaurants')
          .select('name, slug, currency, address')
          .eq('id', dbOrder.restaurant_id)
          .maybeSingle();

        // Fetch order items
        const { data: dbItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', dbOrder.id);

        const items: OrderItem[] = (dbItems || []).map((item) => ({
          id: item.id,
          menuItemId: item.menu_item_id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isVeg: item.is_veg,
          notes: item.notes || undefined,
        }));

        return NextResponse.json({
          success: true,
          order: {
            id: dbOrder.id,
            orderCode: dbOrder.order_code,
            tableNumber: dbOrder.table_number,
            status: dbOrder.status,
            paymentStatus: dbOrder.payment_status,
            paymentMethod: dbOrder.payment_method,
            items,
            subtotal: dbOrder.subtotal,
            tax: dbOrder.tax,
            tip: dbOrder.tip || 0,
            total: dbOrder.total,
            createdAt: dbOrder.created_at,
            updatedAt: dbOrder.updated_at,
          },
          restaurant: {
            name: dbRest?.name || 'Restaurant',
            slug: dbRest?.slug || '',
            currency: dbRest?.currency || '₹',
            address: dbRest?.address || '',
          },
          source: 'supabase',
        });
      }
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
      source: 'memory',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order tracking lookup failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
