-- ============================================
-- MIGRATION 011: ATM Withdrawals Table
-- Track ATM withdrawals for chime accounts with ATM enabled
-- ============================================

CREATE TABLE atm_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Chime account reference (must have atm_withdrawal_enabled = true)
    chime_account_id UUID NOT NULL REFERENCES chime_accounts(id),
    
    -- Withdrawal details
    amount NUMERIC(12,2) NOT NULL,
    withdrawn_at DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Optional notes
    notes TEXT,
    
    -- Who recorded it
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id),
    
    -- Constraints
    CONSTRAINT positive_atm_amount CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_atm_withdrawals_chime_account ON atm_withdrawals(chime_account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_atm_withdrawals_date ON atm_withdrawals(withdrawn_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE atm_withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS policies (authenticated users can read all, modify own)
CREATE POLICY "Authenticated users can read ATM withdrawals"
    ON atm_withdrawals FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert ATM withdrawals"
    ON atm_withdrawals FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own ATM withdrawals"
    ON atm_withdrawals FOR UPDATE
    TO authenticated
    USING (recorded_by = auth.uid())
    WITH CHECK (recorded_by = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_atm_withdrawals_updated_at
    BEFORE UPDATE ON atm_withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- View for ATM withdrawals with account info
-- ============================================
CREATE VIEW atm_withdrawals_with_account AS
SELECT 
    aw.*,
    ca.nickname AS chime_nickname,
    ca.tag AS chime_tag,
    p.name AS recorded_by_name
FROM atm_withdrawals aw
JOIN chime_accounts ca ON aw.chime_account_id = ca.id
LEFT JOIN profiles p ON aw.recorded_by = p.id
WHERE aw.deleted_at IS NULL;
