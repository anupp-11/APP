"use server";

import { createAdminClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export interface Transaction {
  id: string;
  direction: "deposit" | "withdraw";
  amount: number;
  sourceType: "chime" | "platform";
  chimeAccountId: string | null;
  chimeNickname: string | null;
  paymentPlatformId: string | null;
  platformName: string | null;
  gameId: string | null;
  gameName: string | null;
  gameTag: string | null;
  withdrawSubtype: "normal" | "atm" | null;
  notes: string | null;
  operatorId: string;
  operatorName: string | null;
  createdAt: string;
}

export interface TransactionFilters {
  direction?: "deposit" | "withdraw";
  sourceType?: "chime" | "platform";
  chimeAccountId?: string;
  paymentPlatformId?: string;
  gameId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// Get Recent Transactions
// ============================================

export async function getTransactions(filters?: TransactionFilters): Promise<{
  data: Transaction[] | null;
  error: string | null;
  total: number;
}> {
  const supabase = createAdminClient();

  // Build the query
  let query = supabase
    .from("transactions")
    .select(`
      id,
      direction,
      amount,
      source_type,
      chime_account_id,
      payment_platform_id,
      game_id,
      withdraw_subtype,
      notes,
      operator_id,
      created_at,
      chime_accounts!transactions_chime_account_id_fkey(nickname),
      payment_platforms!transactions_payment_platform_id_fkey(name),
      games!transactions_game_id_fkey(name, tag),
      profiles!transactions_operator_id_fkey(name)
    `, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.direction) {
    query = query.eq("direction", filters.direction);
  }
  if (filters?.sourceType) {
    query = query.eq("source_type", filters.sourceType);
  }
  if (filters?.chimeAccountId) {
    query = query.eq("chime_account_id", filters.chimeAccountId);
  }
  if (filters?.paymentPlatformId) {
    query = query.eq("payment_platform_id", filters.paymentPlatformId);
  }
  if (filters?.gameId) {
    query = query.eq("game_id", filters.gameId);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  // Pagination
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error loading transactions:", error);
    return { data: null, error: error.message, total: 0 };
  }

  const transactions: Transaction[] = (data || []).map((row: any) => ({
    id: row.id,
    direction: row.direction,
    amount: Number(row.amount),
    sourceType: row.source_type,
    chimeAccountId: row.chime_account_id,
    chimeNickname: row.chime_accounts?.nickname || null,
    paymentPlatformId: row.payment_platform_id,
    platformName: row.payment_platforms?.name || null,
    gameId: row.game_id,
    gameName: row.games?.name || null,
    gameTag: row.games?.tag || null,
    withdrawSubtype: row.withdraw_subtype,
    notes: row.notes,
    operatorId: row.operator_id,
    operatorName: row.profiles?.name || null,
    createdAt: row.created_at,
  }));

  return { data: transactions, error: null, total: count || 0 };
}

// ============================================
// Get Filter Options (for dropdowns)
// ============================================

export async function getFilterOptions(): Promise<{
  chimeAccounts: Array<{ id: string; nickname: string }>;
  platforms: Array<{ id: string; name: string }>;
  games: Array<{ id: string; name: string }>;
}> {
  const supabase = createAdminClient();

  const [chimeResult, platformResult, gameResult] = await Promise.all([
    supabase
      .from("chime_accounts")
      .select("id, nickname")
      .is("deleted_at", null)
      .order("nickname"),
    supabase
      .from("payment_platforms")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("games")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
  ]);

  return {
    chimeAccounts: chimeResult.data || [],
    platforms: platformResult.data || [],
    games: gameResult.data || [],
  };
}
