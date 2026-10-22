import { NextRequest, NextResponse } from 'next/server';
import { lookupTableByToken, getServerPaymentSettings, getServerMenuItems } from '@/lib/server-data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Table token is required' }, { status: 400 });
    }

    const resolved = lookupTableByToken(token);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Invalid or inactive dining table QR code' },
        { status: 404 }
      );
    }

    const { table, restaurant } = resolved;
    const paymentSettings = getServerPaymentSettings(restaurant.id);
    const menuItems = getServerMenuItems(restaurant.id).filter((item) => item.isAvailable);

    return NextResponse.json({
      success: true,
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
      },
      restaurant: {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        currency: restaurant.currency,
        gstRate: restaurant.gstRate,
        logoUrl: restaurant.logoUrl,
        coverUrl: restaurant.coverUrl,
      },
      paymentSettings: {
        upiQrEnabled: paymentSettings.upiQrEnabled,
        upiAppEnabled: paymentSettings.upiAppEnabled,
        cardEnabled: paymentSettings.cardEnabled,
        counterPaymentEnabled: paymentSettings.counterPaymentEnabled,
        upiId: paymentSettings.upiId,
        payeeName: paymentSettings.payeeName,
        upiQrImagePath: paymentSettings.upiQrImagePath,
      },
      menuItemsCount: menuItems.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to lookup table';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
