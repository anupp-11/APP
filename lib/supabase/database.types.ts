// ============================================
// Supabase Database Types
// Generated from schema
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "operator";
export type AccountType = "holding" | "paying";
export type AccountStatus = "active" | "inactive";
export type TransactionDirection = "deposit" | "withdraw";
export type SourceType = "chime" | "platform";
export type WithdrawSubtype = "normal" | "atm";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRole;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chime_accounts: {
        Row: {
          id: string;
          nickname: string;
          type: AccountType;
          status: AccountStatus;
          monthly_in_limit: number;
          monthly_out_limit: number;
          atm_withdrawal_enabled: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          nickname: string;
          type: AccountType;
          status?: AccountStatus;
          monthly_in_limit?: number;
          monthly_out_limit?: number;
          atm_withdrawal_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          nickname?: string;
          type?: AccountType;
          status?: AccountStatus;
          monthly_in_limit?: number;
          monthly_out_limit?: number;
          atm_withdrawal_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
      };
      payment_platforms: {
        Row: {
          id: string;
          name: string;
          tag: string | null;
          deposit_url: string | null;
          withdraw_url: string | null;
          balance: number;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tag?: string | null;
          deposit_url?: string | null;
          withdraw_url?: string | null;
          balance?: number;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string | null;
          deposit_url?: string | null;
          withdraw_url?: string | null;
          balance?: number;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
      };
      games: {
        Row: {
          id: string;
          name: string;
          tag: string;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          operator_id: string;
          direction: TransactionDirection;
          amount: number;
          source_type: SourceType;
          chime_account_id: string | null;
          payment_platform_id: string | null;
          game_id: string | null;
          withdraw_subtype: WithdrawSubtype | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          operator_id: string;
          direction: TransactionDirection;
          amount: number;
          source_type: SourceType;
          chime_account_id?: string | null;
          payment_platform_id?: string | null;
          game_id?: string | null;
          withdraw_subtype?: WithdrawSubtype | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          operator_id?: string;
          direction?: TransactionDirection;
          amount?: number;
          source_type?: SourceType;
          chime_account_id?: string | null;
          payment_platform_id?: string | null;
          game_id?: string | null;
          withdraw_subtype?: WithdrawSubtype | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
      };
    };
    Views: {
      chime_accounts_with_totals: {
        Row: {
          id: string;
          nickname: string;
          type: AccountType;
          status: AccountStatus;
          monthly_in_limit: number;
          monthly_out_limit: number;
          atm_withdrawal_enabled: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          current_month_in: number;
          current_month_out: number;
          remaining_in: number;
          remaining_out: number;
        };
      };
      today_transactions: {
        Row: {
          id: string;
          operator_id: string;
          direction: TransactionDirection;
          amount: number;
          source_type: SourceType;
          chime_account_id: string | null;
          payment_platform_id: string | null;
          game_id: string | null;
          withdraw_subtype: WithdrawSubtype | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          chime_account_name: string | null;
          platform_name: string | null;
          game_name: string | null;
          operator_name: string | null;
        };
      };
    };
    Functions: {
      create_transaction_with_limit_check: {
        Args: {
          p_direction: TransactionDirection;
          p_amount: number;
          p_source_type: SourceType;
          p_chime_account_id?: string | null;
          p_payment_platform_id?: string | null;
          p_game_id?: string | null;
          p_withdraw_subtype?: WithdrawSubtype;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      soft_delete_transaction: {
        Args: {
          p_transaction_id: string;
        };
        Returns: Json;
      };
      get_quick_transaction_data: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_today_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_monthly_account_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_operator_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_my_profile_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      account_type: AccountType;
      account_status: AccountStatus;
      transaction_direction: TransactionDirection;
      source_type: SourceType;
      withdraw_subtype: WithdrawSubtype;
    };
  };
}

// ============================================
// Convenience Types
// ============================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Table row types
export type Profile = Tables<"profiles">;
export type ChimeAccount = Tables<"chime_accounts">;
export type PaymentPlatform = Tables<"payment_platforms">;
export type Game = Tables<"games">;
export type Transaction = Tables<"transactions">;

// View row types
export type ChimeAccountWithTotals = Views<"chime_accounts_with_totals">;
export type TodayTransaction = Views<"today_transactions">;

// ============================================
// RPC Response Types
// ============================================

export interface QuickTransactionData {
  chime_accounts: Array<{
    id: string;
    nickname: string;
    tag: string | null;
    type: AccountType;
    status: AccountStatus;
    monthly_in_limit: number;
    monthly_out_limit: number;
    atm_withdrawal_enabled: boolean;
    current_month_in: number;
    current_month_out: number;
  }>;
  payment_platforms: Array<{
    id: string;
    name: string;
    tag: string | null;
    deposit_url: string | null;
    withdraw_url: string | null;
    balance: number;
    status: AccountStatus;
  }>;
  games: Array<{
    id: string;
    name: string;
    tag: string;
  }>;
  fetched_at: string;
}

export interface TodaySummary {
  today_deposits: number;
  today_withdrawals: number;
  today_net: number;
  transaction_count: number;
  date: string;
}

export interface MonthlyAccountSummary {
  accounts: Array<{
    id: string;
    nickname: string;
    type: AccountType;
    status: AccountStatus;
    monthly_in_limit: number;
    monthly_out_limit: number;
    atm_withdrawal_enabled: boolean;
    current_month_in: number;
    current_month_out: number;
    remaining_in: number;
    remaining_out: number;
    in_percentage: number;
    out_percentage: number;
  }>;
  month: string;
  fetched_at: string;
}

export interface TransactionResponse {
  success: boolean;
  transaction_id?: string;
  error?: string;
  message: string;
  current_total?: number;
  limit?: number;
  remaining?: number;
  requested?: number;
}

export interface DeleteResponse {
  success: boolean;
  error?: string;
  message: string;
}
