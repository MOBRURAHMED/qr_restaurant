import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  getServerMenuItems,
  addServerMenuItem,
  updateServerMenuItem,
  toggleServerItemStock,
  deleteServerMenuItem,
  getServerRestaurant,
} from '@/lib/server-data';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: restaurantId } = await context.params;
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data: dbItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });

      if (!error && dbItems && dbItems.length > 0) {
        // Map snake_case to frontend camelCase
        const items = dbItems.map((item) => ({
          id: item.id,
          restaurantId: item.restaurant_id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          isVeg: item.is_veg,
          isAvailable: item.is_available,
          imageUrl: item.image_url,
          spicyLevel: item.spicy_level || 1,
        }));
        return NextResponse.json({ items }, { status: 200 });
      }
    }

    // Fallback to in-memory store
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

    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data: inserted, error: insertErr } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurantId,
          name: name.trim(),
          description: description?.trim() || '',
          price: Math.round(price),
          category_id: categoryId || null,
          is_veg: Boolean(isVeg),
          image_url: imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
          spicy_level: validSpicyLevel,
          is_available: isAvailable !== false,
        })
        .select()
        .single();

      if (!insertErr && inserted) {
        const item = {
          id: inserted.id,
          restaurantId: inserted.restaurant_id,
          categoryId: inserted.category_id,
          name: inserted.name,
          description: inserted.description,
          price: inserted.price,
          isVeg: inserted.is_veg,
          isAvailable: inserted.is_available,
          imageUrl: inserted.image_url,
          spicyLevel: inserted.spicy_level,
        };
        return NextResponse.json({ item }, { status: 201 });
      }
    }

    // Fallback to in-memory store
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

    const supabase = getSupabaseServerClient();

    if (supabase) {
      if (action === 'toggle-stock') {
        const { data: current } = await supabase
          .from('menu_items')
          .select('is_available')
          .eq('id', itemId)
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (current) {
          const nextState = !current.is_available;
          const { data: updated } = await supabase
            .from('menu_items')
            .update({ is_available: nextState, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .select()
            .single();

          if (updated) {
            return NextResponse.json({
              success: true,
              item: {
                id: updated.id,
                restaurantId: updated.restaurant_id,
                isAvailable: updated.is_available,
              },
            });
          }
        }
      } else if (action === 'update-price' && typeof price === 'number') {
        const { data: updated } = await supabase
          .from('menu_items')
          .update({ price: Math.round(price), updated_at: new Date().toISOString() })
          .eq('id', itemId)
          .eq('restaurant_id', restaurantId)
          .select()
          .single();

        if (updated) {
          return NextResponse.json({
            success: true,
            item: {
              id: updated.id,
              restaurantId: updated.restaurant_id,
              price: updated.price,
            },
          });
        }
      }
    }

    // Fallback to in-memory store
    if (action === 'toggle-stock') {
      const updated = toggleServerItemStock(restaurantId, itemId);
      return NextResponse.json({ success: true, item: updated });
    }

    if (action === 'update-price' && typeof price === 'number') {
      const updated = updateServerMenuItem(restaurantId, itemId, { price });
      return NextResponse.json({ success: true, item: updated });
    }

    if (updates && typeof updates === 'object') {
      const updated = updateServerMenuItem(restaurantId, itemId, updates);
      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
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

    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)
        .eq('restaurant_id', restaurantId);
    }

    deleteServerMenuItem(restaurantId, itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
