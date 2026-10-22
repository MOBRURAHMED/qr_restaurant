import { NextRequest, NextResponse } from 'next/server';
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

    const userId = `user-${Date.now().toString(36)}`;
    const slug = restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { restaurant, membership } = createServerRestaurant(
      {
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        name: restaurantName,
        tagline: 'Fresh Flavours & Table QR Dining',
        phone,
        currency: currency || '₹',
        logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&auto=format&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        address: address || 'Main Commercial Street',
        gstRate: 0.05,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        fullName: fullName || restaurantName,
      },
      restaurant,
      membership,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
