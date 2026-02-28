-- ============================================
-- MIGRATION 013: Credits Table
-- Track player credits with add/pay transactions
-- ============================================

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Player reference
    player_id UUID NOT NULL REFERENCES players(id),
    
    -- Transaction details
    amount DECIMAL(12,2) NOT NULL, -- positive = add credit, negative = pay credit
    type TEXT NOT NULL CHECK (type IN ('add', 'pay')),
    
    -- Notes
    notes TEXT,
    
    -- Who created it
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_credit_transactions_player ON credit_transactions(player_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can read credit_transactions"
    ON credit_transactions FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert credit_transactions"
    ON credit_transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update credit_transactions"
    ON credit_transactions FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- View for player balances
-- ============================================
CREATE VIEW player_credits AS
SELECT 
    p.id AS player_id,
    p.name AS player_name,
    p.fb_link,
    p.friend_on,
    COALESCE(SUM(ct.amount), 0) AS balance,
    COUNT(ct.id) AS transaction_count,
    MAX(ct.created_at) AS last_transaction_at
FROM players p
LEFT JOIN credit_transactions ct ON p.id = ct.player_id AND ct.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.fb_link, p.friend_on;

-- ============================================
-- View for credit transactions with details
-- ============================================
CREATE VIEW credit_transactions_view AS
SELECT 
    ct.*,
    p.name AS player_name,
    pr.name AS created_by_name
FROM credit_transactions ct
JOIN players p ON ct.player_id = p.id
LEFT JOIN profiles pr ON ct.created_by = pr.id
WHERE ct.deleted_at IS NULL;

-- Grant access to views
GRANT SELECT ON player_credits TO authenticated;
GRANT SELECT ON credit_transactions_view TO authenticated;
