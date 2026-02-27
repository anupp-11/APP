/**
 * Supabase API Wrapper
 * Client-side functions for the ChimeTracker app
 */

import { createClient } from "./client";
import type {
  TransactionDirection,
  SourceType,
  WithdrawSubtype,
  QuickTransactionData,
  TodaySummary,
  MonthlyAccountSummary,
  TransactionResponse,
  DeleteResponse,
  TodayTransaction,
} from "./database.types";

// ============================================
// QUICK TRANSACTION PAGE
// ============================================

/**
 * Fetch all data needed for the Quick Transaction form
 * Returns: chime accounts with monthly totals, platforms, games
 */
export async function fetchQuickTransactionData(): Promise<{
  data: QuickTransactionData | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_quick_transaction_data");

  if (error) {
    console.error("Error fetching quick transaction data:", error);
    return { data: null, error: error.message };
  }

  return { data: data as QuickTransactionData, error: null };
}

/**
 * Submit a transaction via the RPC function
 * This enforces all limit checks server-side
 */
export async function submitTransaction(params: {
  direction: TransactionDirection;
  amount: number;
  sourceType: SourceType;
  chimeAccountId?: string;
  paymentPlatformId?: string;
  gameId?: string;
  withdrawSubtype?: WithdrawSubtype;
  notes?: string;
}): Promise<TransactionResponse> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "create_transaction_with_limit_check",
    {
      p_direction: params.direction,
      p_amount: params.amount,
      p_source_type: params.sourceType,
      p_chime_account_id: params.chimeAccountId ?? null,
      p_payment_platform_id: params.paymentPlatformId ?? null,
      p_game_id: params.gameId ?? null,
      p_withdraw_subtype: params.withdrawSubtype ?? "normal",
      p_notes: params.notes ?? null,
    }
  );

  if (error) {
    console.error("Error submitting transaction:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message,
    };
  }

  return data as TransactionResponse;
}

// ============================================
// TODAY SUMMARY
// ============================================

/**
 * Get today's transaction summary
 */
export async function fetchTodaySummary(): Promise<{
  data: TodaySummary | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_today_summary");

  if (error) {
    console.error("Error fetching today summary:", error);
    return { data: null, error: error.message };
  }

  return { data: data as TodaySummary, error: null };
}

// ============================================
// MONTHLY ACCOUNT SUMMARY
// ============================================

/**
 * Get detailed monthly summary for all accounts
 */
export async function fetchMonthlyAccountSummary(): Promise<{
  data: MonthlyAccountSummary | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_monthly_account_summary");

  if (error) {
    console.error("Error fetching monthly summary:", error);
    return { data: null, error: error.message };
  }

  return { data: data as MonthlyAccountSummary, error: null };
}

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Fetch today's transactions
 */
export async function fetchTodayTransactions(): Promise<{
  data: TodayTransaction[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("today_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching today transactions:", error);
    return { data: null, error: error.message };
  }

  return { data: data as TodayTransaction[], error: null };
}

/**
 * Fetch transactions by date range
 */
export async function fetchTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<{
  data: TodayTransaction[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      chime_accounts!chime_account_id(nickname),
      payment_platforms!payment_platform_id(name),
      games!game_id(name),
      profiles!operator_id(name)
    `
    )
    .gte("created_at", startDate)
    .lt("created_at", endDate)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return { data: null, error: error.message };
  }

  // Transform the nested data to match TodayTransaction shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformed = data?.map((t: any) => ({
    ...t,
    chime_account_name: t.chime_accounts?.nickname ?? null,
    platform_name: t.payment_platforms?.name ?? null,
    game_name: t.games?.name ?? null,
    operator_name: t.profiles?.name ?? null,
  }));

  return { data: transformed as TodayTransaction[], error: null };
}

/**
 * Soft delete a transaction
 */
export async function deleteTransaction(
  transactionId: string
): Promise<DeleteResponse> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("soft_delete_transaction", {
    p_transaction_id: transactionId,
  });

  if (error) {
    console.error("Error deleting transaction:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message,
    };
  }

  return data as DeleteResponse;
}

// ============================================
// REFERENCE DATA (direct queries)
// ============================================

/**
 * Fetch active games (for dropdowns)
 */
export async function fetchActiveGames(): Promise<{
  data: Array<{ id: string; name: string; tag: string }> | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("games")
    .select("id, name, tag")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error fetching games:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Fetch active payment platforms
 */
export async function fetchActivePlatforms(): Promise<{
  data: Array<{ id: string; name: string; tag: string }> | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("payment_platforms")
    .select("id, name, tag")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Error fetching platforms:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Fetch chime accounts with current month totals
 */
export async function fetchChimeAccountsWithTotals(): Promise<{
  data: Array<{
    id: string;
    nickname: string;
    type: string;
    status: string;
    monthly_in_limit: number;
    monthly_out_limit: number;
    atm_withdrawal_enabled: boolean;
    current_month_in: number;
    current_month_out: number;
    remaining_in: number;
    remaining_out: number;
  }> | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chime_accounts_with_totals")
    .select("*")
    .order("type")
    .order("nickname");

  if (error) {
    console.error("Error fetching chime accounts:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
