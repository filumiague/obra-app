import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-only privileged operations (Storage uploads
// from server actions). Never import this from client components.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// "midias" bucket is private — generate a short-lived signed URL for display.
export async function getSignedMidiaUrl(storagePath: string) {
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("midias")
    .createSignedUrl(storagePath, 60 * 60);
  return data?.signedUrl ?? null;
}
