// ============================================
// Core Types for ChimeTracker
// ============================================

export type TransactionType = "deposit" | "withdraw";
export type TransactionDirection = TransactionType; // Alias for Supabase compatibility

export type AccountType = "holding" | "paying";

export type SourceType = "chime" | "platform";

export type AccountStatus = "active" | "inactive";

export type WithdrawSubtype = "normal" | "atm";

// ============================================
// Chime Account
// ============================================

export interface ChimeAccount {
  id: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  
  // Configurable per-account limits
  monthly_in_limit: number;
  monthly_out_limit: number;
  atm_withdrawal_allowed: boolean;
  
  // Current month usage
  current_month_in: number;
  current_month_out: number;
  
  // Computed (can be derived, but useful for display)
  remaining_in: number;
  remaining_out: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Payment Platform
// ============================================

export interface PaymentPlatform {
  id: string;
  name: string;
  type: "platform";
  status: AccountStatus;
  
  // Platforms may have different tracking
  description?: string;
  color?: string; // For visual distinction
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Unified Source (for selection UI)
// ============================================

export type TransactionSource = 
  | (ChimeAccount & { sourceType: "chime" })
  | (PaymentPlatform & { sourceType: "platform" });

// ============================================
// Game / App
// ============================================

export interface Game {
  id: string;
  name: string;
  code?: string; // Short code for quick reference
  is_active: boolean;
}

// ============================================
// Transaction
// ============================================

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  
  // Source
  source_type: SourceType;
  source_id: string;
  
  // Game reference
  game_id: string;
  
  // Optional notes
  notes?: string;
  
  // Metadata
  created_at: string;
  created_by: string;
}

// ============================================
// Form State
// ============================================

export interface QuickTransactionFormState {
  type: TransactionType;
  gameId: string;
  amount: number;
  notes: string;
  sourceId: string;
  sourceType: SourceType | null;
}

// ============================================
// Validation
// ============================================

export interface ValidationErrors {
  game?: string;
  amount?: string;
  source?: string;
}

// ============================================
// UI State
// ============================================

export interface SourceCardState {
  isSelected: boolean;
  isNearLimit: boolean;
  isCritical: boolean;
  limitPercentIn: number;
  limitPercentOut: number;
}

// ============================================
// Quick Amount Options
// ============================================

export const QUICK_AMOUNTS = [5, 10, 15, 20, 25, 30, 50, 100] as const;

export type QuickAmount = (typeof QUICK_AMOUNTS)[number];
