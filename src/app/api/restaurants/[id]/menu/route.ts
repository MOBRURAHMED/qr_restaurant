import { NextRequest, NextResponse } from 'next/server';
import {
  getServerMenuItems,
  addServerMenuItem,
  updateServerMenuItem,
  toggleServerItemStock,
  deleteServerMenuItem,
  getServerRestaurant,
} from '@/lib/server-data';
import { MenuItem } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: restaurantId } = await context.params;
    const restaurant = getServerRestaurant(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const items = getServerMenuItems(restaurantId);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: restaurantId } = await context.params;
    const body = await req.json();

    const { name, description, price, categoryId, isVeg, imageUrl, spicyLevel, isAvailable } = body;

    if (!name || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Name and a positive price are required' },
        { status: 400 }
      );
    }

    const validSpicyLevel = typeof spicyLevel === 'number'
      ? (Math.min(3, Math.max(1, Math.round(spicyLevel))) as 1 | 2 | 3)
      : 1;

    const newItem = addServerMenuItem(restaurantId, {
      name: name.trim(),
      description: description?.trim() || '',
      price,
      categoryId: categoryId || 'cat-1',
      isVeg: Boolean(isVeg),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
      spicyLevel: validSpicyLevel,
      isAvailable: isAvailable !== false,
    });

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id: restaurantId } = await context.params;
    const body = await req.json();
    const { itemId, action, price, updates } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    if (action === 'toggle_stock') {
      const updated = toggleServerItemStock(restaurantId, itemId);
      return NextResponse.json({ item: updated }, { status: 200 });
    }

    if (action === 'update_price' && typeof price === 'number') {
      const updated = updateServerMenuItem(restaurantId, itemId, { price });
      return NextResponse.json({ item: updated }, { status: 200 });
    }

    if (updates && typeof updates === 'object') {
      const updated = updateServerMenuItem(restaurantId, itemId, updates);
      return NextResponse.json({ item: updated }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action or update payload' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id: restaurantId } = await context.params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'itemId query param required' }, { status: 400 });
    }

    const deleted = deleteServerMenuItem(restaurantId, itemId);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
