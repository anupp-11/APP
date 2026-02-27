-- ============================================
-- MIGRATION 008: Add tag, initial_balance, pin to chime_accounts
-- ============================================

-- Add new columns
ALTER TABLE chime_accounts
ADD COLUMN IF NOT EXISTS tag TEXT,
ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS pin TEXT;

-- Drop and recreate the view to include new columns
DROP VIEW IF EXISTS chime_accounts_with_totals;
CREATE VIEW chime_accounts_with_totals AS
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
