"use server";

import { createAdminClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface PlayerCredit {
  playerId: string;
  playerName: string;
  fbLink: string | null;
  friendOn: string | null;
  balance: number;
  transactionCount: number;
  lastTransactionAt: string | null;
}

export interface CreditTransaction {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  type: "add" | "pay";
  notes: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
}

// ============================================
// Load Player Credits (balances)
// ============================================

export async function loadPlayerCredits(): Promise<{
  data: PlayerCredit[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("player_credits") as any)
    .select("*")
    .order("player_name");

  if (error) {
    console.error("Error loading player credits:", error);
    return { data: null, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const credits: PlayerCredit[] = (data || []).map((row: any) => ({
    playerId: row.player_id,
    playerName: row.player_name,
    fbLink: row.fb_link,
    friendOn: row.friend_on,
    balance: parseFloat(row.balance) || 0,
    transactionCount: parseInt(row.transaction_count) || 0,
    lastTransactionAt: row.last_transaction_at,
  }));

  return { data: credits, error: null };
}

// ============================================
// Load Credit Transactions for a Player
// ============================================

export async function loadCreditTransactions(playerId: string): Promise<{
  data: CreditTransaction[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("credit_transactions_view") as any)
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading credit transactions:", error);
    return { data: null, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: CreditTransaction[] = (data || []).map((row: any) => ({
    id: row.id,
    playerId: row.player_id,
    playerName: row.player_name,
    amount: parseFloat(row.amount) || 0,
    type: row.type,
    notes: row.notes,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }));

  return { data: transactions, error: null };
}

// ============================================
// Add Credit
// ============================================

interface AddCreditParams {
  playerId: string;
  amount: number;
  notes?: string;
}

export async function addCredit(
  params: AddCreditParams
): Promise<{ success: boolean; error?: string }> {
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

  // Insert credit transaction (positive amount)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("credit_transactions") as any).insert({
    player_id: params.playerId,
    amount: Math.abs(params.amount), // Ensure positive
    type: "add",
    notes: params.notes || null,
    created_by: profileId,
  });

  if (error) {
    console.error("Error adding credit:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/credits");
  return { success: true };
}

// ============================================
// Pay Credit (reduce balance)
// ============================================

interface PayCreditParams {
  playerId: string;
  amount: number;
  notes?: string;
}

export async function payCredit(
  params: PayCreditParams
): Promise<{ success: boolean; error?: string }> {
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

  // Insert credit transaction (negative amount)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("credit_transactions") as any).insert({
    player_id: params.playerId,
    amount: -Math.abs(params.amount), // Ensure negative
    type: "pay",
    notes: params.notes || null,
    created_by: profileId,
  });

  if (error) {
    console.error("Error paying credit:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/credits");
  return { success: true };
}

// ============================================
// Delete Credit Transaction
// ============================================

export async function deleteCreditTransaction(
  id: string
): Promise<{ success: boolean; error?: string }> {
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

  // Soft delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("credit_transactions") as any)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: profileId,
    })
    .eq("id", id);

  if (error) {
    console.error("Error deleting credit transaction:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/credits");
  return { success: true };
}

