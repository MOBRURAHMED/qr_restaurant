import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerOrdersByRestaurant, verifyMemberAccess } from '@/lib/server-data';
import { Order, OrderItem } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    if (userId) {
      const access = verifyMemberAccess(userId, restaurantId, ['owner', 'manager', 'kitchen', 'waiter']);
      if (!access.authorized) {
        return NextResponse.json(
          { error: access.error || 'Cross-tenant access forbidden' },
          { status: 403 }
        );
      }
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: dbOrders, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (!orderErr && dbOrders) {
        // Fetch order items for these orders
        const orderIds = dbOrders.map((o) => o.id);
        const { data: dbItems } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        const itemsByOrderId: Record<string, OrderItem[]> = {};
        if (dbItems) {
          dbItems.forEach((item) => {
            if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
            itemsByOrderId[item.order_id].push({
              id: item.id,
              menuItemId: item.menu_item_id || item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              isVeg: item.is_veg,
              notes: item.notes || undefined,
            });
          });
        }

        const formattedOrders: Order[] = dbOrders.map((o) => ({
          id: o.id,
          restaurantId: o.restaurant_id,
          tableNumber: o.table_number,
          orderCode: o.order_code,
          trackingToken: o.tracking_token,
          idempotencyKey: o.idempotency_key,
          customerName: o.customer_name || 'Guest',
          customerPhone: o.customer_phone || '',
          specialInstructions: o.special_instructions || '',
          items: itemsByOrderId[o.id] || [],
          subtotal: o.subtotal,
          tax: o.tax,
          tip: o.tip || 0,
          total: o.total,
          status: o.status,
          paymentStatus: o.payment_status,
          paymentMethod: o.payment_method,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));

        return NextResponse.json({
          success: true,
          orders: formattedOrders,
          count: formattedOrders.length,
          source: 'supabase',
        });
      }
    }

    const orders = getServerOrdersByRestaurant(restaurantId);
    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
      source: 'memory',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Orders fetch failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
