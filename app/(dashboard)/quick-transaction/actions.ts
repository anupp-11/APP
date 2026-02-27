"use server";

import { createAdminClient, createAuthenticatedClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  TransactionDirection,
  SourceType,
  WithdrawSubtype,
  TransactionResponse,
  QuickTransactionData,
  TodaySummary,
} from "@/lib/supabase/database.types";

// ============================================
// Data Types
// ============================================

export interface ChimeAccountStats {
  id: string;
  nickname: string;
  tag: string | null;
  type: "holding" | "paying";
  status: "active" | "inactive";
  monthlyInLimit: number;
  monthlyOutLimit: number;
  atmWithdrawalEnabled: boolean;
  currentMonthIn: number;
  currentMonthOut: number;
  remainingIn: number;
  remainingOut: number;
  inPercentage: number;
  outPercentage: number;
  isNearInLimit: boolean;
  isNearOutLimit: boolean;
  isCriticalIn: boolean;
  isCriticalOut: boolean;
}

export interface PlatformInfo {
  id: string;
  name: string;
  depositUrl: string | null;
  withdrawUrl: string | null;
  balance: number;
  status: "active" | "inactive";
}

export interface GameInfo {
  id: string;
  name: string;
  tag: string;
}

export interface QuickTransactionPageData {
  chimeAccounts: ChimeAccountStats[];
  platforms: PlatformInfo[];
  games: GameInfo[];
  fetchedAt: string;
}

// ============================================
// Helper: Calculate limit percentages and warnings
// ============================================

function calculateAccountStats(account: {
  id: string;
  nickname: string;
  tag: string | null;
  type: string;
  status: string;
  monthly_in_limit: number;
  monthly_out_limit: number;
  atm_withdrawal_enabled: boolean;
  current_month_in: number;
  current_month_out: number;
}): ChimeAccountStats {
  const inPercentage = account.monthly_in_limit > 0
    ? Math.round((account.current_month_in / account.monthly_in_limit) * 100)
    : 0;
  const outPercentage = account.monthly_out_limit > 0
    ? Math.round((account.current_month_out / account.monthly_out_limit) * 100)
    : 0;

  return {
    id: account.id,
    nickname: account.nickname,
    tag: account.tag,
    type: account.type as "holding" | "paying",
    status: account.status as "active" | "inactive",
    monthlyInLimit: Number(account.monthly_in_limit),
    monthlyOutLimit: Number(account.monthly_out_limit),
    atmWithdrawalEnabled: account.atm_withdrawal_enabled,
    currentMonthIn: Number(account.current_month_in),
    currentMonthOut: Number(account.current_month_out),
    remainingIn: Number(account.monthly_in_limit) - Number(account.current_month_in),
    remainingOut: Number(account.monthly_out_limit) - Number(account.current_month_out),
    inPercentage,
    outPercentage,
    isNearInLimit: inPercentage >= 80,
    isNearOutLimit: outPercentage >= 80,
    isCriticalIn: inPercentage >= 95,
    isCriticalOut: outPercentage >= 95,
  };
}

// ============================================
// Server Action: Load Quick Transaction Data
// Single optimized query via RPC
// ============================================

export async function loadQuickTransactionData(): Promise<{
  data: QuickTransactionPageData | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_quick_transaction_data");

  if (error) {
    console.error("Error loading quick transaction data:", error);
    return { data: null, error: error.message };
  }

  const rawData = data as QuickTransactionData;

  // Transform to typed DTOs with calculated stats
  const chimeAccounts: ChimeAccountStats[] = rawData.chime_accounts.map(calculateAccountStats);
  
  const platforms: PlatformInfo[] = rawData.payment_platforms.map((p) => ({
    id: p.id,
    name: p.name,
    depositUrl: p.deposit_url || null,
    withdrawUrl: p.withdraw_url || null,
    balance: Number(p.balance) || 0,
    status: p.status,
  }));

  const games: GameInfo[] = rawData.games.map((g) => ({
    id: g.id,
    name: g.name,
    tag: g.tag,
  }));

  return {
    data: {
      chimeAccounts,
      platforms,
      games,
      fetchedAt: rawData.fetched_at,
    },
    error: null,
  };
}

// ============================================
// Server Action: Submit Transaction
// Uses RPC with server-side limit enforcement
// ============================================

export async function submitTransactionAction(params: {
  direction: TransactionDirection;
  amount: number;
  sourceType: SourceType;
  chimeAccountId?: string;
  paymentPlatformId?: string;
  gameId?: string;
  withdrawSubtype?: WithdrawSubtype;
  notes?: string;
}): Promise<TransactionResponse> {
  // Use authenticated client with user's access token for auth.uid() to work
  const supabase = await createAuthenticatedClient();

  if (!supabase) {
    return {
      success: false,
      error: "UNAUTHORIZED",
      message: "Not authenticated",
    };
  }

  const { data, error } = await supabase.rpc("create_transaction_with_limit_check", {
    p_direction: params.direction,
    p_amount: params.amount,
    p_source_type: params.sourceType,
    p_chime_account_id: params.chimeAccountId ?? null,
    p_payment_platform_id: params.paymentPlatformId ?? null,
    p_game_id: params.gameId ?? null,
    p_withdraw_subtype: params.withdrawSubtype ?? "normal",
    p_notes: params.notes ?? null,
  });

  if (error) {
    console.error("Error submitting transaction:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message,
    };
  }

  // Revalidate the quick transaction page data
  revalidatePath("/quick-transaction");

  return data as TransactionResponse;
}

// ============================================
// Server Action: Get Today Summary
// ============================================

export async function loadTodaySummary(): Promise<{
  data: TodaySummary | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_today_summary");

  if (error) {
    console.error("Error loading today summary:", error);
    return { data: null, error: error.message };
  }

  return { data: data as TodaySummary, error: null };
}

// ============================================
// Server Action: Load All Chime Accounts (for CRUD)
// ============================================

export async function loadChimeAccounts(): Promise<{
  data: ChimeAccountStats[] | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_monthly_account_summary");

  if (error) {
    console.error("Error loading chime accounts:", error);
    return { data: null, error: error.message };
  }

  const rawData = data as { accounts: any[]; month: string; fetched_at: string };
  const accounts = rawData.accounts.map(calculateAccountStats);

  return { data: accounts, error: null };
}

// ============================================
// Server Action: Update Chime Account Limits
// ============================================

export async function updateChimeAccountLimits(params: {
  id: string;
  monthlyInLimit: number;
  monthlyOutLimit: number;
  atmWithdrawalEnabled: boolean;
  status?: "active" | "inactive";
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("chime_accounts")
    .update({
      monthly_in_limit: params.monthlyInLimit,
      monthly_out_limit: params.monthlyOutLimit,
      atm_withdrawal_enabled: params.atmWithdrawalEnabled,
      status: params.status,
    })
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
// Server Action: Create Chime Account
// ============================================

export async function createChimeAccount(params: {
  nickname: string;
  type: "holding" | "paying";
  monthlyInLimit: number;
  monthlyOutLimit: number;
  atmWithdrawalEnabled: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chime_accounts")
    .insert({
      nickname: params.nickname,
      type: params.type,
      monthly_in_limit: params.monthlyInLimit,
      monthly_out_limit: params.monthlyOutLimit,
      atm_withdrawal_enabled: params.atmWithdrawalEnabled,
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
// Server Action: Load Payment Platforms
// ============================================

export async function loadPaymentPlatforms(): Promise<{
  data: Array<{
    id: string;
    name: string;
    tag: string;
    depositUrl: string | null;
    withdrawUrl: string | null;
    status: "active" | "inactive";
  }> | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payment_platforms")
    .select("id, name, tag, deposit_url, withdraw_url, status")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error loading platforms:", error);
    return { data: null, error: error.message };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.map((p: any) => ({
      id: p.id,
      name: p.name,
      tag: p.tag,
      depositUrl: p.deposit_url,
      withdrawUrl: p.withdraw_url,
      status: p.status as "active" | "inactive",
    })),
    error: null,
  };
}

// ============================================
// Server Action: Update Payment Platform (Admin)
// ============================================

export async function updatePaymentPlatform(params: {
  id: string;
  name: string;
  depositUrl?: string;
  withdrawUrl?: string;
  status: "active" | "inactive";
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("payment_platforms")
    .update({
      name: params.name,
      deposit_url: params.depositUrl,
      withdraw_url: params.withdrawUrl,
      status: params.status,
    })
    .eq("id", params.id);

  if (error) {
    console.error("Error updating platform:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/platforms");
  revalidatePath("/quick-transaction");

  return { success: true };
}

// ============================================
// Server Action: Get Near-Limit Accounts
// ============================================

export async function loadNearLimitAccounts(): Promise<{
  data: ChimeAccountStats[] | null;
  error: string | null;
}> {
  const { data, error } = await loadChimeAccounts();

  if (error || !data) {
    return { data: null, error };
  }

  // Filter to accounts that are near limit (>= 80%)
  const nearLimit = data.filter(
    (a) => a.status === "active" && (a.isNearInLimit || a.isNearOutLimit)
  );

  return { data: nearLimit, error: null };
}
