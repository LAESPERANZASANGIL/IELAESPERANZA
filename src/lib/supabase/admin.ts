import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con service role: solo para operaciones administrativas server-side
// (invitar usuarios, crear cuentas) que requieren saltar RLS. Nunca exponer al cliente.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url, options) => fetch(url, { ...(options ?? {}), cache: "no-store" }),
      },
    },
  );
}
