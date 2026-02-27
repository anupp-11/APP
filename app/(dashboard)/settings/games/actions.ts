"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface GameFull {
  id: string;
  name: string;
  tag: string;
  status: "active" | "inactive";
  createdAt: string;
}

// ============================================
// Load All Games
// ============================================

export async function loadGames(): Promise<{
  data: GameFull[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error loading games:", error);
    return { data: null, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games: GameFull[] = data.map((row: any) => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    status: row.status as "active" | "inactive",
    createdAt: row.created_at,
  }));

  return { data: games, error: null };
}

// ============================================
// Create Game
// ============================================

export async function createGame(params: {
  name: string;
  tag: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("games")
    .insert({
      name: params.name,
      tag: params.tag.toLowerCase().replace(/\s+/g, "_"),
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating game:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/quick-transaction");

  return { success: true, id: data.id };
}

// ============================================
// Update Game
// ============================================

export async function updateGame(params: {
  id: string;
  name?: string;
  tag?: string;
  status?: "active" | "inactive";
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (params.name !== undefined) updates.name = params.name;
  if (params.tag !== undefined) updates.tag = params.tag.toLowerCase().replace(/\s+/g, "_");
  if (params.status !== undefined) updates.status = params.status;

  const { error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    console.error("Error updating game:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Delete Game (soft delete)
// ============================================

export async function deleteGame(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("games")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    console.error("Error deactivating game:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Reactivate Game
// ============================================

export async function reactivateGame(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("games")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    console.error("Error reactivating game:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/quick-transaction");

  return { success: true };
}
