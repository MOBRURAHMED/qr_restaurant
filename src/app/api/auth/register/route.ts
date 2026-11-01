import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createServerRestaurant } from '@/lib/server-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, restaurantName, phone, address, currency } = body;

    if (!email || !restaurantName || !phone) {
      return NextResponse.json(
        { error: 'Email, restaurantName, and phone are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanRestName = restaurantName.trim();
    const cleanAddress = address?.trim() || 'Main Dining Street';
    const cleanCurrency = currency || '₹';

    const slug = cleanRestName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;

    const supabase = getSupabaseServerClient();

    // 1. If Supabase is connected, write to PostgreSQL tables with proper relations
    if (supabase) {
      let userId: string;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        userId = crypto.randomUUID();
        const { error: profileErr } = await supabase.from('profiles').insert({
          id: userId,
          email: cleanEmail,
          full_name: fullName?.trim() || cleanRestName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileErr) {
          const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: { full_name: fullName?.trim() || cleanRestName },
          });

          if (!authErr && authUser?.user) {
            userId = authUser.user.id;
          }
        }
      }

      // Create Restaurant record
      const { data: restaurantRow, error: restErr } = await supabase
        .from('restaurants')
        .insert({
          slug: uniqueSlug,
          name: cleanRestName,
          tagline: 'Fresh Flavours & Table QR Dining',
          phone: cleanPhone,
          currency: cleanCurrency,
          logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
          cover_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
          address: cleanAddress,
          gst_rate: 0.05,
          is_active: true,
        })
        .select()
        .single();

      if (restErr || !restaurantRow) {
        throw new Error(restErr?.message || 'Failed to create restaurant in database');
      }

      const restId = restaurantRow.id;

      // Add Owner Membership in restaurant_members
      await supabase.from('restaurant_members').insert({
        restaurant_id: restId,
        user_id: userId,
        role: 'owner',
      });

      // Create Payment Settings
      await supabase.from('restaurant_payment_settings').insert({
        restaurant_id: restId,
        upi_qr_enabled: true,
        upi_app_enabled: true,
        card_enabled: true,
        counter_payment_enabled: true,
        upi_id: `${cleanRestName.replace(/\s+/g, '').toLowerCase()}@upi`,
        payee_name: cleanRestName,
      });

      // Auto-provision Tables 1 to 10
      const defaultTables = Array.from({ length: 10 }, (_, i) => ({
        restaurant_id: restId,
        table_number: String(i + 1),
        qr_token: `tbl_${restId.substring(0, 8)}_${i + 1}_${Math.random().toString(36).substring(2, 8)}`,
        capacity: 4,
        is_active: true,
      }));
      await supabase.from('dining_tables').insert(defaultTables);

      // Seed Starter Categories & Menu Items
      const starterCats = [
        { name: 'Starters & Quick Bites', sort_order: 1 },
        { name: 'Signature Main Course', sort_order: 2 },
        { name: 'Beverages & Desserts', sort_order: 3 },
      ];

      for (const cat of starterCats) {
        const { data: catRow } = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: restId,
            name: cat.name,
            sort_order: cat.sort_order,
            is_active: true,
          })
          .select()
          .single();

        if (catRow) {
          if (cat.name.includes('Starters')) {
            await supabase.from('menu_items').insert([
              {
                restaurant_id: restId,
                category_id: catRow.id,
                name: 'Crispy Paneer Chilli Bites',
                description: 'Wok-tossed cottage cheese with bell peppers and green chillies',
                price: 240,
                is_veg: true,
                is_available: true,
                spicy_level: 2,
                image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
              },
              {
                restaurant_id: restId,
                category_id: catRow.id,
                name: 'Tandoori Murgh Tikka',
                description: 'Char-grilled succulent chicken skewers marinated in hung curd and spices',
                price: 320,
                is_veg: false,
                is_available: true,
                spicy_level: 2,
                image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
              },
            ]);
          } else if (cat.name.includes('Main')) {
            await supabase.from('menu_items').insert([
              {
                restaurant_id: restId,
                category_id: catRow.id,
                name: 'Smoked Dal Makhani',
                description: 'Slow-simmered black lentils with churned butter and dairy cream',
                price: 280,
                is_veg: true,
                is_available: true,
                spicy_level: 1,
                image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop&q=80',
              },
              {
                restaurant_id: restId,
                category_id: catRow.id,
                name: 'Awadhi Butter Chicken',
                description: 'Classic roasted chicken pulled into a rich tomato, butter and fenugreek gravy',
                price: 380,
                is_veg: false,
                is_available: true,
                spicy_level: 1,
                image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&auto=format&fit=crop&q=80',
              },
            ]);
          } else {
            await supabase.from('menu_items').insert([
              {
                restaurant_id: restId,
                category_id: catRow.id,
                name: 'Masala Spiced Kulhad Chai',
                description: 'Hand-pounded cardamom, ginger and premium Assam tea served hot in earthenware',
                price: 60,
                is_veg: true,
                is_available: true,
                spicy_level: 1,
                image_url: 'https://images.unsplash.com/photo-1571934811356-5cc506b3a985?w=400&auto=format&fit=crop&q=80',
              },
            ]);
          }
        }
      }

      // Also register in-memory server cache
      createServerRestaurant(
        {
          slug: uniqueSlug,
          name: cleanRestName,
          tagline: 'Fresh Flavours & Table QR Dining',
          phone: cleanPhone,
          currency: cleanCurrency,
          logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
          address: cleanAddress,
          gstRate: 0.05,
        },
        userId
      );

      return NextResponse.json({
        success: true,
        source: 'supabase',
        user: {
          id: userId,
          email: cleanEmail,
          fullName: fullName?.trim() || cleanRestName,
        },
        restaurant: restaurantRow,
      });
    }

    // Fallback to in-memory store
    const fallbackUserId = `user-${Date.now().toString(36)}`;
    const { restaurant, membership } = createServerRestaurant(
      {
        slug: uniqueSlug,
        name: cleanRestName,
        tagline: 'Fresh Flavours & Table QR Dining',
        phone: cleanPhone,
        currency: cleanCurrency,
        logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        address: cleanAddress,
        gstRate: 0.05,
      },
      fallbackUserId
    );

    return NextResponse.json({
      success: true,
      source: 'memory',
      user: {
        id: fallbackUserId,
        email: cleanEmail,
        fullName: fullName || cleanRestName,
      },
      restaurant,
      membership,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
