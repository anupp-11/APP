import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Get the current session from our custom cookie
export async function getSession() {
  const cookieStore = await cookies();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/([^.]+)/)?.[1] || "supabase";
  const authCookie = cookieStore.get(`sb-${projectRef}-auth-token`);

  if (!authCookie?.value) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(authCookie.value, "base64").toString());
    if (decoded.access_token && decoded.expires_at > Date.now() / 1000) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

// Get user ID from session
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

// Create Supabase client with service role for admin operations
// This bypasses RLS - use carefully!
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Create Supabase client with the user's access token for authenticated operations
// This properly sets auth.uid() for RPC calls
export async function createAuthenticatedClient() {
  const session = await getSession();
  
  if (!session?.access_token) {
    return null;
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

