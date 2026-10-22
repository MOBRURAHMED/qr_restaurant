import { NextRequest, NextResponse } from 'next/server';
import { getServerOrdersByRestaurant, verifyMemberAccess } from '@/lib/server-data';

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

    // Role check and tenant isolation
    if (userId) {
      const access = verifyMemberAccess(userId, restaurantId, ['owner', 'manager', 'kitchen', 'waiter']);
      if (!access.authorized) {
        return NextResponse.json(
          { error: access.error || 'Cross-tenant access forbidden' },
          { status: 403 }
        );
      }
    }

    const orders = getServerOrdersByRestaurant(restaurantId);

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Orders fetch failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
