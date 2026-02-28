"use server";

import { createAdminClient, createAuthenticatedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface ATMWithdrawal {
  id: string;
  chimeAccountId: string;
  chimeNickname: string;
  chimeTag: string | null;
  amount: number;
  withdrawnAt: string;
  notes: string | null;
  recordedBy: string;
  recordedByName: string | null;
  createdAt: string;
}

export interface ChimeAccountForATM {
  id: string;
  nickname: string;
  tag: string | null;
}

// ============================================
// Load ATM-enabled Chime Accounts
// ============================================

export async function getATMEnabledAccounts(): Promise<{
  data: ChimeAccountForATM[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Debug: First check how many accounts exist with ATM enabled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("chime_accounts") as any)
    .select("id, nickname, tag, atm_withdrawal_enabled, status, deleted_at")
    .eq("atm_withdrawal_enabled", true)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("nickname");

  console.log("ATM accounts query result:", { data, error });

  if (error) {
    console.error("Error loading ATM accounts:", error);
    return { data: null, error: error.message };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.map((a: any) => ({
      id: a.id,
      nickname: a.nickname,
      tag: a.tag,
    })),
    error: null,
  };
}

// ============================================
// Load ATM Withdrawals
// ============================================

export async function getATMWithdrawals(options?: {
  chimeAccountId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{
  data: ATMWithdrawal[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("atm_withdrawals_with_account") as any)
    .select("*")
    .order("withdrawn_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.chimeAccountId) {
    query = query.eq("chime_account_id", options.chimeAccountId);
  }

  if (options?.startDate) {
    query = query.gte("withdrawn_at", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("withdrawn_at", options.endDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading ATM withdrawals:", error);
    return { data: null, error: error.message };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.map((row: any) => ({
      id: row.id,
      chimeAccountId: row.chime_account_id,
      chimeNickname: row.chime_nickname,
      chimeTag: row.chime_tag,
      amount: Number(row.amount),
      withdrawnAt: row.withdrawn_at,
      notes: row.notes,
      recordedBy: row.recorded_by,
      recordedByName: row.recorded_by_name,
      createdAt: row.created_at,
    })),
    error: null,
  };
}

// ============================================
// Create ATM Withdrawal
// ============================================

export async function createATMWithdrawal(params: {
  chimeAccountId: string;
  amount: number;
  withdrawnAt: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAuthenticatedClient();

  if (!supabase) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the current user's profile ID (not auth user ID)
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "User profile not found" };
  }

  const profileId = (profile as { id: string }).id;

  // Verify the chime account has ATM enabled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error: accountError } = await (supabase.from("chime_accounts") as any)
    .select("id, atm_withdrawal_enabled")
    .eq("id", params.chimeAccountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: "Chime account not found" };
  }

  if (!account.atm_withdrawal_enabled) {
    return { success: false, error: "ATM withdrawal is not enabled for this account" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("atm_withdrawals") as any).insert({
    chime_account_id: params.chimeAccountId,
    amount: params.amount,
    withdrawn_at: params.withdrawnAt,
    notes: params.notes?.trim() || null,
    recorded_by: profileId,
  });

  if (error) {
    console.error("Error creating ATM withdrawal:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/atm");
  return { success: true };
}

// ============================================
// Update ATM Withdrawal
// ============================================

export async function updateATMWithdrawal(params: {
  id: string;
  amount?: number;
  withdrawnAt?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAuthenticatedClient();

  if (!supabase) {
    return { success: false, error: "Not authenticated" };
  }

  const updates: Record<string, unknown> = {};
  if (params.amount !== undefined) updates.amount = params.amount;
  if (params.withdrawnAt !== undefined) updates.withdrawn_at = params.withdrawnAt;
  if (params.notes !== undefined) updates.notes = params.notes.trim() || null;

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("atm_withdrawals") as any)
    .update(updates)
    .eq("id", params.id);

  if (error) {
    console.error("Error updating ATM withdrawal:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/atm");
  return { success: true };
}

// ============================================
// Delete ATM Withdrawal (soft delete)
// ============================================

export async function deleteATMWithdrawal(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAuthenticatedClient();

  if (!supabase) {
    return { success: false, error: "Not authenticated" };
  }

  // Get the current user's profile ID
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  const profileId = (profile as { id: string } | null)?.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("atm_withdrawals") as any)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: profileId || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error deleting ATM withdrawal:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/atm");
  return { success: true };
}

// ============================================
// Get ATM Summary by Account
// ============================================

export async function getATMSummaryByAccount(): Promise<{
  data: Array<{
    chimeAccountId: string;
    chimeNickname: string;
    chimeTag: string | null;
    totalWithdrawals: number;
    withdrawalCount: number;
    lastWithdrawal: string | null;
  }> | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_atm_summary_by_account");

  if (error) {
    // If RPC doesn't exist, fall back to manual query
    console.error("RPC error, using fallback:", error);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: withdrawals, error: wError } = await (supabase.from("atm_withdrawals_with_account") as any)
      .select("*");

    if (wError) {
      return { data: null, error: wError.message };
    }

    // Aggregate manually
    const summaryMap = new Map<string, {
      chimeAccountId: string;
      chimeNickname: string;
      chimeTag: string | null;
      totalWithdrawals: number;
      withdrawalCount: number;
      lastWithdrawal: string | null;
    }>();

    for (const w of withdrawals || []) {
      const existing = summaryMap.get(w.chime_account_id);
      if (existing) {
        existing.totalWithdrawals += Number(w.amount);
        existing.withdrawalCount += 1;
        if (!existing.lastWithdrawal || w.withdrawn_at > existing.lastWithdrawal) {
          existing.lastWithdrawal = w.withdrawn_at;
        }
      } else {
        summaryMap.set(w.chime_account_id, {
          chimeAccountId: w.chime_account_id,
          chimeNickname: w.chime_nickname,
          chimeTag: w.chime_tag,
          totalWithdrawals: Number(w.amount),
          withdrawalCount: 1,
          lastWithdrawal: w.withdrawn_at,
        });
      }
    }

    return { data: Array.from(summaryMap.values()), error: null };
  }

  return { data, error: null };
}
