import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServerOrdersByRestaurant } from '@/lib/server-data';
import { OrderItem } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (!orderErr && dbOrder) {
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
            restaurantId: dbOrder.restaurant_id,
            tableNumber: dbOrder.table_number,
            orderCode: dbOrder.order_code,
            trackingToken: dbOrder.tracking_token,
            idempotencyKey: dbOrder.idempotency_key,
            customerName: dbOrder.customer_name || 'Guest',
            customerPhone: dbOrder.customer_phone || '',
            specialInstructions: dbOrder.special_instructions || '',
            items,
            subtotal: dbOrder.subtotal,
            tax: dbOrder.tax,
            tip: dbOrder.tip || 0,
            total: dbOrder.total,
            status: dbOrder.status,
            paymentStatus: dbOrder.payment_status,
            paymentMethod: dbOrder.payment_method,
            createdAt: dbOrder.created_at,
            updatedAt: dbOrder.updated_at,
          },
          source: 'supabase',
        });
      }
    }

    // Fallback: search in-memory orders across all seeded restaurants
    const defaultRests = ['rest-1', 'rest-2'];
    for (const rId of defaultRests) {
      const orders = getServerOrdersByRestaurant(rId);
      const match = orders.find((o) => o.id === orderId);
      if (match) {
        return NextResponse.json({ success: true, order: match, source: 'memory' });
      }
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order lookup failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
