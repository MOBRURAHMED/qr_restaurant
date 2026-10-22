import { NextRequest, NextResponse } from 'next/server';
import {
  getServerPaymentSettings,
  updateServerPaymentSettings,
  getServerRestaurant
} from '@/lib/server-data';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: restaurantId } = await context.params;
  const restaurant = getServerRestaurant(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const settings = getServerPaymentSettings(restaurantId);
  return NextResponse.json({ success: true, settings });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await context.params;
    const body = await req.json();

    const restaurant = getServerRestaurant(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const updated = updateServerPaymentSettings(restaurantId, {
      upiQrEnabled: typeof body.upiQrEnabled === 'boolean' ? body.upiQrEnabled : undefined,
      upiAppEnabled: typeof body.upiAppEnabled === 'boolean' ? body.upiAppEnabled : undefined,
      cardEnabled: typeof body.cardEnabled === 'boolean' ? body.cardEnabled : undefined,
      counterPaymentEnabled: typeof body.counterPaymentEnabled === 'boolean' ? body.counterPaymentEnabled : undefined,
      upiQrImagePath: body.upiQrImagePath !== undefined ? body.upiQrImagePath : undefined,
      upiId: body.upiId !== undefined ? body.upiId : undefined,
      payeeName: body.payeeName !== undefined ? body.payeeName : undefined,
      razorpayKeyId: body.razorpayKeyId !== undefined ? body.razorpayKeyId : undefined,
      razorpayConnectedAccountId: body.razorpayConnectedAccountId !== undefined ? body.razorpayConnectedAccountId : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
      settings: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
