/**
 * Supabase Client Architectural Boundary
 * 
 * NOTE ON ARCHITECTURE:
 * Real database calls require valid Supabase environment credentials
 * (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
 * 
 * When credentials are not configured, the application operates in 
 * Demoware / Architectural Staging Mode using isolated seed repositories.
 * We do not claim database persistence or authentication is working
 * until live credentials are provided and tested.
 */

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceKey: boolean;
  statusText: string;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id'));
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key'));
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key'));

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
