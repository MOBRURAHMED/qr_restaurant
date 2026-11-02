import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
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

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data: dbSettings, error } = await supabase
      .from('restaurant_payment_settings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (!error && dbSettings) {
      return NextResponse.json({
        success: true,
        settings: {
          restaurantId: dbSettings.restaurant_id,
          upiQrEnabled: dbSettings.upi_qr_enabled,
          upiAppEnabled: dbSettings.upi_app_enabled,
          cardEnabled: dbSettings.card_enabled,
          counterPaymentEnabled: dbSettings.counter_payment_enabled,
          upiQrImagePath: dbSettings.upi_qr_image_path || undefined,
          upiId: dbSettings.upi_id || undefined,
          payeeName: dbSettings.payee_name || undefined,
          gatewayMode: dbSettings.gateway_mode || 'custom',
          razorpayKeyId: dbSettings.razorpay_key_id || undefined,
          razorpayConnectedAccountId: dbSettings.razorpay_account_id || undefined,
          hasCustomSecret: Boolean(dbSettings.razorpay_key_secret),
          updatedAt: dbSettings.updated_at,
        },
        source: 'supabase',
      });
    }
  }

  const restaurant = getServerRestaurant(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const settings = getServerPaymentSettings(restaurantId);
  return NextResponse.json({ success: true, settings, source: 'memory' });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await context.params;
    const body = await req.json();

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (typeof body.upiQrEnabled === 'boolean') updates.upi_qr_enabled = body.upiQrEnabled;
      if (typeof body.upiAppEnabled === 'boolean') updates.upi_app_enabled = body.upiAppEnabled;
      if (typeof body.cardEnabled === 'boolean') updates.card_enabled = body.cardEnabled;
      if (typeof body.counterPaymentEnabled === 'boolean') updates.counter_payment_enabled = body.counterPaymentEnabled;
      if (body.upiQrImagePath !== undefined) updates.upi_qr_image_path = body.upiQrImagePath;
      if (body.upiId !== undefined) updates.upi_id = body.upiId;
      if (body.payeeName !== undefined) updates.payee_name = body.payeeName;
      if (body.gatewayMode !== undefined) updates.gateway_mode = body.gatewayMode;
      if (body.razorpayKeyId !== undefined) updates.razorpay_key_id = body.razorpayKeyId;
      if (body.razorpayKeySecret !== undefined && body.razorpayKeySecret.trim() !== '') {
        updates.razorpay_key_secret = body.razorpayKeySecret.trim();
      }
      if (body.razorpayConnectedAccountId !== undefined) updates.razorpay_account_id = body.razorpayConnectedAccountId;

      const { data: updatedDb, error } = await supabase
        .from('restaurant_payment_settings')
        .upsert({
          restaurant_id: restaurantId,
          ...updates,
        })
        .select()
        .single();

      if (!error && updatedDb) {
        updateServerPaymentSettings(restaurantId, body);
        return NextResponse.json({
          success: true,
          message: 'Payment settings saved to Supabase',
          settings: {
            restaurantId: updatedDb.restaurant_id,
            upiQrEnabled: updatedDb.upi_qr_enabled,
            upiAppEnabled: updatedDb.upi_app_enabled,
            cardEnabled: updatedDb.card_enabled,
            counterPaymentEnabled: updatedDb.counter_payment_enabled,
            upiQrImagePath: updatedDb.upi_qr_image_path || undefined,
            upiId: updatedDb.upi_id || undefined,
            payeeName: updatedDb.payee_name || undefined,
            gatewayMode: updatedDb.gateway_mode || 'custom',
            razorpayKeyId: updatedDb.razorpay_key_id || undefined,
            razorpayConnectedAccountId: updatedDb.razorpay_account_id || undefined,
            hasCustomSecret: Boolean(updatedDb.razorpay_key_secret),
            updatedAt: updatedDb.updated_at,
          },
        });
      }
    }

    const updated = updateServerPaymentSettings(restaurantId, {
      upiQrEnabled: typeof body.upiQrEnabled === 'boolean' ? body.upiQrEnabled : undefined,
      upiAppEnabled: typeof body.upiAppEnabled === 'boolean' ? body.upiAppEnabled : undefined,
      cardEnabled: typeof body.cardEnabled === 'boolean' ? body.cardEnabled : undefined,
      counterPaymentEnabled: typeof body.counterPaymentEnabled === 'boolean' ? body.counterPaymentEnabled : undefined,
      upiQrImagePath: body.upiQrImagePath !== undefined ? body.upiQrImagePath : undefined,
      upiId: body.upiId !== undefined ? body.upiId : undefined,
      payeeName: body.payeeName !== undefined ? body.payeeName : undefined,
      gatewayMode: body.gatewayMode !== undefined ? body.gatewayMode : undefined,
      razorpayKeyId: body.razorpayKeyId !== undefined ? body.razorpayKeyId : undefined,
      razorpayKeySecret: body.razorpayKeySecret !== undefined ? body.razorpayKeySecret : undefined,
      razorpayConnectedAccountId: body.razorpayConnectedAccountId !== undefined ? body.razorpayConnectedAccountId : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
