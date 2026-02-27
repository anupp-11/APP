import type { ChimeAccount, PaymentPlatform, Game, TransactionSource } from "./types";

// ============================================
// Mock Chime Accounts
// ============================================

export const MOCK_CHIME_ACCOUNTS: ChimeAccount[] = [
  {
    id: "chime-001",
    name: "Primary Holding",
    type: "holding",
    status: "active",
    monthly_in_limit: 2000,
    monthly_out_limit: 2000,
    atm_withdrawal_allowed: true,
    current_month_in: 1250,
    current_month_out: 450,
    remaining_in: 750,
    remaining_out: 1550,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-02-26T14:30:00Z",
  },
  {
    id: "chime-002",
    name: "Operations Alpha",
    type: "paying",
    status: "active",
    monthly_in_limit: 1500,
    monthly_out_limit: 1500,
    atm_withdrawal_allowed: false,
    current_month_in: 890,
    current_month_out: 1320,
    remaining_in: 610,
    remaining_out: 180,
    created_at: "2024-01-20T12:00:00Z",
    updated_at: "2024-02-26T15:00:00Z",
  },
  {
    id: "chime-003",
    name: "Reserve Account",
    type: "holding",
    status: "active",
    monthly_in_limit: 3000,
    monthly_out_limit: 2500,
    atm_withdrawal_allowed: true,
    current_month_in: 2700,
    current_month_out: 800,
    remaining_in: 300,
    remaining_out: 1700,
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-26T11:00:00Z",
  },
  {
    id: "chime-004",
    name: "Backup Pay",
    type: "paying",
    status: "active",
    monthly_in_limit: 1000,
    monthly_out_limit: 1000,
    atm_withdrawal_allowed: false,
    current_month_in: 200,
    current_month_out: 150,
    remaining_in: 800,
    remaining_out: 850,
    created_at: "2024-02-10T08:00:00Z",
    updated_at: "2024-02-26T10:00:00Z",
  },
  {
    id: "chime-005",
    name: "Legacy Account",
    type: "holding",
    status: "inactive",
    monthly_in_limit: 500,
    monthly_out_limit: 500,
    atm_withdrawal_allowed: false,
    current_month_in: 0,
    current_month_out: 0,
    remaining_in: 500,
    remaining_out: 500,
    created_at: "2023-06-01T10:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
  },
];

// ============================================
// Mock Payment Platforms
// ============================================

export const MOCK_PLATFORMS: PaymentPlatform[] = [
  {
    id: "platform-today",
    name: "Platform Today",
    type: "platform",
    status: "active",
    description: "Primary daily operations platform",
    color: "#14B8A6",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-02-26T16:00:00Z",
  },
  {
    id: "platform-solar",
    name: "Solar Payment",
    type: "platform",
    status: "active",
    description: "Solar payment processing platform",
    color: "#F59E0B",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-02-26T16:00:00Z",
  },
];

// ============================================
// Mock Games
// ============================================

export const MOCK_GAMES: Game[] = [
  { id: "game-001", name: "Slots Paradise", code: "SP", is_active: true },
  { id: "game-002", name: "Poker Masters", code: "PM", is_active: true },
  { id: "game-003", name: "Blackjack Elite", code: "BE", is_active: true },
  { id: "game-004", name: "Roulette Royale", code: "RR", is_active: true },
  { id: "game-005", name: "Lucky Dice", code: "LD", is_active: true },
  { id: "game-006", name: "Sports Bet Pro", code: "SBP", is_active: true },
  { id: "game-007", name: "Casino Stars", code: "CS", is_active: true },
  { id: "game-008", name: "Golden Jackpot", code: "GJ", is_active: true },
  { id: "game-009", name: "Fantasy League", code: "FL", is_active: false },
  { id: "game-010", name: "Bingo Blast", code: "BB", is_active: true },
];

// ============================================
// Combined Sources for UI
// ============================================

export const MOCK_SOURCES: TransactionSource[] = [
  ...MOCK_CHIME_ACCOUNTS.map((account) => ({
    ...account,
    sourceType: "chime" as const,
  })),
  ...MOCK_PLATFORMS.map((platform) => ({
    ...platform,
    sourceType: "platform" as const,
  })),
];

// ============================================
// Helper Functions
// ============================================

export function getSourceById(id: string): TransactionSource | undefined {
  return MOCK_SOURCES.find((source) => source.id === id);
}

export function getActiveGames(): Game[] {
  return MOCK_GAMES.filter((game) => game.is_active);
}

export function getActiveSources(): TransactionSource[] {
  return MOCK_SOURCES.filter((source) => source.status === "active");
}

export function calculateLimitPercentage(current: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((current / limit) * 100);
}

export function isNearLimit(current: number, limit: number): boolean {
  return calculateLimitPercentage(current, limit) >= 80;
}

export function isCriticalLimit(current: number, limit: number): boolean {
  return calculateLimitPercentage(current, limit) >= 95;
}
