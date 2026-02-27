"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// Types
// ============================================

export interface ChimeAccountFull {
  id: string;
  nickname: string;
  tag: string | null;
  type: "holding" | "paying";
  status: "active" | "inactive";
  monthlyInLimit: number;
  monthlyOutLimit: number;
  atmWithdrawalEnabled: boolean;
  initialBalance: number;
  pin: string | null;
  currentMonthIn: number;
  currentMonthOut: number;
  createdAt: string;
}

// ============================================
// Load All Chime Accounts (with monthly totals)
// ============================================

export async function loadChimeAccounts(): Promise<{
  data: ChimeAccountFull[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chime_accounts_with_totals")
    .select("*")
    .order("nickname");

  if (error) {
    console.error("Error loading chime accounts:", error);
    return { data: null, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts: ChimeAccountFull[] = data.map((row: any) => ({
    id: row.id,
    nickname: row.nickname,
    tag: row.tag ?? null,
    type: row.type as "holding" | "paying",
    status: row.status as "active" | "inactive",
    monthlyInLimit: Number(row.monthly_in_limit),
    monthlyOutLimit: Number(row.monthly_out_limit),
    atmWithdrawalEnabled: row.atm_withdrawal_enabled,
    initialBalance: Number(row.initial_balance ?? 0),
    pin: row.pin ?? null,
    currentMonthIn: Number(row.current_month_in ?? 0),
    currentMonthOut: Number(row.current_month_out ?? 0),
    createdAt: row.created_at,
  }));

  return { data: accounts, error: null };
}

// ============================================
// Create Chime Account
// ============================================

export async function createChimeAccount(params: {
  nickname: string;
  tag?: string;
  type: "holding" | "paying";
  monthlyInLimit: number;
  monthlyOutLimit: number;
  atmWithdrawalEnabled: boolean;
  initialBalance?: number;
  pin?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chime_accounts")
    .insert({
      nickname: params.nickname,
      tag: params.tag || null,
      type: params.type,
      monthly_in_limit: params.monthlyInLimit,
      monthly_out_limit: params.monthlyOutLimit,
      atm_withdrawal_enabled: params.atmWithdrawalEnabled,
      initial_balance: params.initialBalance ?? 0,
      pin: params.pin || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating chime account:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/quick-transaction");

  return { success: true, id: data.id };
}

// ============================================
// Update Chime Account
// ============================================

export async function updateChimeAccount(params: {
  id: string;
  nickname?: string;
  tag?: string | null;
  type?: "holding" | "paying";
  status?: "active" | "inactive";
  monthlyInLimit?: number;
  monthlyOutLimit?: number;
  atmWithdrawalEnabled?: boolean;
  initialBalance?: number;
  pin?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (params.nickname !== undefined) updates.nickname = params.nickname;
  if (params.tag !== undefined) updates.tag = params.tag;
  if (params.type !== undefined) updates.type = params.type;
  if (params.status !== undefined) updates.status = params.status;
  if (params.monthlyInLimit !== undefined) updates.monthly_in_limit = params.monthlyInLimit;
  if (params.monthlyOutLimit !== undefined) updates.monthly_out_limit = params.monthlyOutLimit;
  if (params.atmWithdrawalEnabled !== undefined) updates.atm_withdrawal_enabled = params.atmWithdrawalEnabled;
  if (params.initialBalance !== undefined) updates.initial_balance = params.initialBalance;
  if (params.pin !== undefined) updates.pin = params.pin;

  const { error } = await supabase
    .from("chime_accounts")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    console.error("Error updating chime account:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Delete Chime Account (soft delete via status)
// ============================================

export async function deleteChimeAccount(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("chime_accounts")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) {
    console.error("Error deleting chime account:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Reactivate Chime Account
// ============================================

export async function reactivateChimeAccount(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("chime_accounts")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    console.error("Error reactivating chime account:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/accounts");
  revalidatePath("/quick-transaction");

  return { success: true };
}
