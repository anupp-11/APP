"use server";

import { createAdminClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface Player {
  id: string;
  name: string;
  fbLink: string | null;
  friendOn: string | null;
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
}

// ============================================
// Load All Players
// ============================================

export async function loadPlayers(): Promise<{
  data: Player[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("players_with_creator") as any)
    .select("*")
    .order("name");

  if (error) {
    console.error("Error loading players:", error);
    return { data: null, error: error.message };
  }

  const players: Player[] = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    fbLink: row.fb_link,
    friendOn: row.friend_on,
    notes: row.notes,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }));

  return { data: players, error: null };
}

// ============================================
// Create Player
// ============================================

interface CreatePlayerParams {
  name: string;
  fbLink?: string;
  friendOn?: string;
  notes?: string;
}

export async function createPlayer(params: CreatePlayerParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get profile ID from user ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  const profileId = (profile as { id: string }).id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("players") as any).insert({
    name: params.name.trim(),
    fb_link: params.fbLink?.trim() || null,
    friend_on: params.friendOn?.trim() || null,
    notes: params.notes?.trim() || null,
    created_by: profileId,
  });

  if (error) {
    console.error("Error creating player:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/players");
  return { success: true };
}

// ============================================
// Update Player
// ============================================

interface UpdatePlayerParams {
  id: string;
  name: string;
  fbLink?: string;
  friendOn?: string;
  notes?: string;
}

export async function updatePlayer(params: UpdatePlayerParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("players") as any)
    .update({
      name: params.name.trim(),
      fb_link: params.fbLink?.trim() || null,
      friend_on: params.friendOn?.trim() || null,
      notes: params.notes?.trim() || null,
    })
    .eq("id", params.id);

  if (error) {
    console.error("Error updating player:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/players");
  return { success: true };
}

// ============================================
// Delete Player (soft delete)
// ============================================

export async function deletePlayer(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get profile ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  const profileId = profile ? (profile as { id: string }).id : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("players") as any)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: profileId,
    })
    .eq("id", id);

  if (error) {
    console.error("Error deleting player:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/players");
  return { success: true };
}
