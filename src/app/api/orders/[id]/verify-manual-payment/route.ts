import { NextRequest, NextResponse } from 'next/server';
import { verifyManualPayment } from '@/lib/server-data';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { actingUserId, notes } = body;

    if (!orderId || !actingUserId) {
      return NextResponse.json(
        { error: 'Missing required field: actingUserId' },
        { status: 400 }
      );
    }

    const updatedOrder = verifyManualPayment(orderId, actingUserId, notes);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failure';
    const isForbidden = message.includes('Forbidden') || message.includes('Unauthorized');
    return NextResponse.json({ error: message }, { status: isForbidden ? 403 : 400 });
  }
}
