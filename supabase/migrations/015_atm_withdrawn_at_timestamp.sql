-- ============================================
-- MIGRATION 015: Change ATM withdrawn_at to TIMESTAMPTZ
-- Allow storing both date AND time for ATM withdrawals
-- ============================================

-- Change the column type from DATE to TIMESTAMPTZ
ALTER TABLE atm_withdrawals 
  ALTER COLUMN withdrawn_at TYPE TIMESTAMPTZ 
  USING withdrawn_at::timestamptz;

-- Update the default to use NOW() instead of CURRENT_DATE
ALTER TABLE atm_withdrawals 
  ALTER COLUMN withdrawn_at SET DEFAULT NOW();

-- Drop and recreate the view to reflect the change
DROP VIEW IF EXISTS atm_withdrawals_with_account;

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
