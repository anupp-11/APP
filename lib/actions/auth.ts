"use server";

import { createAdminClient, getUserId } from "@/lib/supabase/server";

export async function getCurrentUserRole(): Promise<"admin" | "operator" | null> {
  const userId = await getUserId();
  
  if (!userId) {
    return null;
  }

  const supabase = createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("profiles") as any)
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("Error getting user role:", error);
    return null;
  }

  return (data as { role: string }).role as "admin" | "operator";
}
