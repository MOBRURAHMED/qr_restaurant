import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceKey: boolean;
  statusText: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(supabaseUrl && !supabaseUrl.includes('your-project-id'));
  const hasAnonKey = Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-anon-key'));
  const hasServiceKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY && 
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key')
  );

  const isConfigured = hasUrl && hasAnonKey;

  return {
    isConfigured,
    hasUrl,
    hasAnonKey,
    hasServiceKey,
    statusText: isConfigured 
      ? 'Supabase configured with active credentials' 
      : 'Demo Mode: Supabase credentials not detected; using isolated mock seed data',
  };
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) return null;

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return browserClient;
}
