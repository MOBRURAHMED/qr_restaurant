import { NextRequest, NextResponse } from 'next/server';
import { transitionServerOrderStatus } from '@/lib/server-data';
import { OrderStatus } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { targetStatus, actingUserId, notes } = body;

    if (!orderId || !targetStatus || !actingUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: targetStatus and actingUserId' },
        { status: 400 }
      );
    }

    const updatedOrder = transitionServerOrderStatus(
      orderId,
      targetStatus as OrderStatus,
      actingUserId,
      notes
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Status transition failure';
    const isForbidden = message.includes('Forbidden') || message.includes('Unauthorized') || message.includes('cannot transition');
    return NextResponse.json({ error: message }, { status: isForbidden ? 403 : 400 });
  }
}
