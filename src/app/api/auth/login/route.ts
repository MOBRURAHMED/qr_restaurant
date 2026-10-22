import { NextRequest, NextResponse } from 'next/server';
import { getServerProfile, getServerUserMemberships, getServerRestaurants } from '@/lib/server-data';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const allRestaurants = getServerRestaurants();

    // Map demo / mock staff or match profiles
    let user = getServerProfile('user-owner-1');
    if (cleanEmail.includes('urbanchai') || cleanEmail.includes('tanvi')) {
      user = getServerProfile('user-owner-2') || user;
    } else if (cleanEmail.includes('chef') || cleanEmail.includes('harpal')) {
      user = getServerProfile('user-chef-1') || user;
    }

    const memberships = getServerUserMemberships(user?.id || 'user-owner-1');
    const userRestaurants = allRestaurants.filter((r) =>
      memberships.some((m) => m.restaurantId === r.id)
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: cleanEmail,
        fullName: user?.fullName || 'Restaurant Administrator',
      },
      memberships,
      restaurants: userRestaurants,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
