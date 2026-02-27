-- ============================================
-- ChimeTracker Database Schema
-- Version: 1.0.0
-- All timestamps in UTC
-- All monetary values: numeric(12,2)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'operator');
CREATE TYPE account_type AS ENUM ('holding', 'paying');
CREATE TYPE account_status AS ENUM ('active', 'inactive');
CREATE TYPE transaction_direction AS ENUM ('deposit', 'withdraw');
CREATE TYPE source_type AS ENUM ('chime', 'platform');
CREATE TYPE withdraw_subtype AS ENUM ('normal', 'atm');

-- ============================================
-- PROFILES TABLE
-- Links to Supabase auth.users
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'operator',
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- CHIME ACCOUNTS TABLE
-- Per-account configurable limits
-- ============================================

CREATE TABLE chime_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname TEXT NOT NULL,
    type account_type NOT NULL,
    status account_status NOT NULL DEFAULT 'active',
    
    -- Per-account configurable monthly limits
    monthly_in_limit NUMERIC(12,2) NOT NULL DEFAULT 2000.00,
    monthly_out_limit NUMERIC(12,2) NOT NULL DEFAULT 2000.00,
    
    -- ATM withdrawal only relevant for holding accounts
    atm_withdrawal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id),
    
    CONSTRAINT positive_limits CHECK (
        monthly_in_limit >= 0 AND monthly_out_limit >= 0
    )
);

-- Indexes for active account queries
CREATE INDEX idx_chime_accounts_status ON chime_accounts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_chime_accounts_type ON chime_accounts(type) WHERE deleted_at IS NULL;

-- ============================================
-- PAYMENT PLATFORMS TABLE
-- External payment platforms (Platform Today, Solar, etc.)
-- ============================================

CREATE TABLE payment_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tag TEXT NOT NULL UNIQUE, -- Short code like 'platform_today', 'solar'
    deposit_url TEXT,
    withdraw_url TEXT,
    status account_status NOT NULL DEFAULT 'active',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id)
);

-- Index for active platforms
CREATE INDEX idx_payment_platforms_status ON payment_platforms(status) WHERE deleted_at IS NULL;

-- ============================================
-- GAMES TABLE
-- Games/apps that transactions are associated with
-- ============================================

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tag TEXT NOT NULL UNIQUE, -- Short code like 'slots_paradise'
    status account_status NOT NULL DEFAULT 'active',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id)
);

-- Index for active games
CREATE INDEX idx_games_status ON games(status) WHERE deleted_at IS NULL;

-- ============================================
-- TRANSACTIONS TABLE
-- Core transaction records
-- ============================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who created it
    operator_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Transaction details
    direction transaction_direction NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    
    -- Source (one of these must be set based on source_type)
    source_type source_type NOT NULL,
    chime_account_id UUID REFERENCES chime_accounts(id),
    payment_platform_id UUID REFERENCES payment_platforms(id),
    
    -- Game reference (required for deposits, optional for withdrawals)
    game_id UUID REFERENCES games(id),
    
    -- Withdraw type (only for withdrawals from chime)
    withdraw_subtype withdraw_subtype DEFAULT 'normal',
    
    -- Optional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id),
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    
    -- Ensure correct source is set
    CONSTRAINT valid_source CHECK (
        (source_type = 'chime' AND chime_account_id IS NOT NULL AND payment_platform_id IS NULL)
        OR
        (source_type = 'platform' AND payment_platform_id IS NOT NULL AND chime_account_id IS NULL)
    ),
    
    -- Deposits require a game
    CONSTRAINT deposit_requires_game CHECK (
        direction = 'withdraw' OR game_id IS NOT NULL
    ),
    
    -- Withdraw subtype only for withdrawals
    CONSTRAINT withdraw_subtype_only_for_withdrawals CHECK (
        direction = 'withdraw' OR withdraw_subtype IS NULL OR withdraw_subtype = 'normal'
    )
);

-- ============================================
-- TRANSACTION INDEXES
-- Optimized for monthly aggregates and today queries
-- ============================================

-- Primary index for monthly aggregates by chime account
-- Covers: current month totals, remaining limits
CREATE INDEX idx_transactions_chime_monthly ON transactions (
    chime_account_id,
    direction,
    created_at DESC
) WHERE deleted_at IS NULL AND chime_account_id IS NOT NULL;

-- Index for "today" queries (all transactions)
CREATE INDEX idx_transactions_today ON transactions (
    created_at DESC
) WHERE deleted_at IS NULL;

-- Index for operator's own transactions
CREATE INDEX idx_transactions_operator ON transactions (
    operator_id,
    created_at DESC
) WHERE deleted_at IS NULL;

-- Index for platform transactions
CREATE INDEX idx_transactions_platform ON transactions (
    payment_platform_id,
    created_at DESC
) WHERE deleted_at IS NULL AND payment_platform_id IS NOT NULL;

-- Index for game-based queries
CREATE INDEX idx_transactions_game ON transactions (
    game_id,
    created_at DESC
) WHERE deleted_at IS NULL AND game_id IS NOT NULL;

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at on row changes
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chime_accounts_updated_at
    BEFORE UPDATE ON chime_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_platforms_updated_at
    BEFORE UPDATE ON payment_platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER VIEW: Chime Accounts with Monthly Totals
-- Pre-computes current month IN/OUT for each account
-- ============================================

CREATE OR REPLACE VIEW chime_accounts_with_totals AS
SELECT 
    ca.*,
    COALESCE(monthly_in.total, 0) AS current_month_in,
    COALESCE(monthly_out.total, 0) AS current_month_out,
    ca.monthly_in_limit - COALESCE(monthly_in.total, 0) AS remaining_in,
    ca.monthly_out_limit - COALESCE(monthly_out.total, 0) AS remaining_out
FROM chime_accounts ca
LEFT JOIN LATERAL (
    SELECT SUM(t.amount) AS total
    FROM transactions t
    WHERE t.chime_account_id = ca.id
      AND t.direction = 'deposit'
      AND t.deleted_at IS NULL
      AND t.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
) monthly_in ON TRUE
LEFT JOIN LATERAL (
    SELECT SUM(t.amount) AS total
    FROM transactions t
    WHERE t.chime_account_id = ca.id
      AND t.direction = 'withdraw'
      AND t.deleted_at IS NULL
      AND t.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
) monthly_out ON TRUE
WHERE ca.deleted_at IS NULL;

-- ============================================
-- HELPER VIEW: Today's Transactions Summary
-- ============================================

CREATE OR REPLACE VIEW today_transactions AS
SELECT 
    t.*,
    ca.nickname AS chime_account_name,
    pp.name AS platform_name,
    g.name AS game_name,
    p.name AS operator_name
FROM transactions t
LEFT JOIN chime_accounts ca ON t.chime_account_id = ca.id
LEFT JOIN payment_platforms pp ON t.payment_platform_id = pp.id
LEFT JOIN games g ON t.game_id = g.id
LEFT JOIN profiles p ON t.operator_id = p.id
WHERE t.deleted_at IS NULL
  AND t.created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
