-- ============================================
-- EXAMPLE QUERIES
-- Common queries the UI will use
-- ============================================

-- ============================================
-- 1. LISTING ACCOUNTS WITH MONTHLY TOTALS + REMAINING
-- Used on: Quick Transaction page (source cards), Accounts page
-- ============================================

-- Option A: Use the helper view
SELECT * FROM chime_accounts_with_totals
WHERE status = 'active'
ORDER BY type, nickname;

-- Option B: Direct query with calculations
SELECT 
    ca.id,
    ca.nickname,
    ca.type,
    ca.status,
    ca.monthly_in_limit,
    ca.monthly_out_limit,
    ca.atm_withdrawal_enabled,
    COALESCE(SUM(CASE WHEN t.direction = 'deposit' THEN t.amount ELSE 0 END), 0) AS current_month_in,
    COALESCE(SUM(CASE WHEN t.direction = 'withdraw' THEN t.amount ELSE 0 END), 0) AS current_month_out,
    ca.monthly_in_limit - COALESCE(SUM(CASE WHEN t.direction = 'deposit' THEN t.amount ELSE 0 END), 0) AS remaining_in,
    ca.monthly_out_limit - COALESCE(SUM(CASE WHEN t.direction = 'withdraw' THEN t.amount ELSE 0 END), 0) AS remaining_out,
    ROUND(
        COALESCE(SUM(CASE WHEN t.direction = 'deposit' THEN t.amount ELSE 0 END), 0) / 
        NULLIF(ca.monthly_in_limit, 0) * 100, 
        1
    ) AS in_percentage,
    ROUND(
        COALESCE(SUM(CASE WHEN t.direction = 'withdraw' THEN t.amount ELSE 0 END), 0) / 
        NULLIF(ca.monthly_out_limit, 0) * 100, 
        1
    ) AS out_percentage
FROM chime_accounts ca
LEFT JOIN transactions t ON t.chime_account_id = ca.id
    AND t.deleted_at IS NULL
    AND t.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
WHERE ca.deleted_at IS NULL
GROUP BY ca.id
ORDER BY ca.type, ca.nickname;

-- Option C: Use the RPC (recommended - most efficient)
SELECT get_quick_transaction_data();

-- ============================================
-- 2. TODAY TOTALS
-- Used on: Dashboard header, Quick Transaction summary
-- ============================================

-- Option A: Use the helper view
SELECT 
    SUM(CASE WHEN direction = 'deposit' THEN amount ELSE 0 END) AS today_deposits,
    SUM(CASE WHEN direction = 'withdraw' THEN amount ELSE 0 END) AS today_withdrawals,
    SUM(CASE WHEN direction = 'deposit' THEN amount ELSE -amount END) AS today_net,
    COUNT(*) AS transaction_count
FROM today_transactions;

-- Option B: Direct query
SELECT 
    COALESCE(SUM(CASE WHEN direction = 'deposit' THEN amount ELSE 0 END), 0) AS today_deposits,
    COALESCE(SUM(CASE WHEN direction = 'withdraw' THEN amount ELSE 0 END), 0) AS today_withdrawals,
    COUNT(*) AS transaction_count
FROM transactions
WHERE deleted_at IS NULL
  AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');

-- Option C: Use the RPC (recommended)
SELECT get_today_summary();

-- ============================================
-- 3. TODAY'S TRANSACTIONS LIST
-- Used on: History page (default view)
-- ============================================

SELECT 
    t.id,
    t.direction,
    t.amount,
    t.source_type,
    t.withdraw_subtype,
    t.notes,
    t.created_at,
    ca.nickname AS chime_account_name,
    ca.type AS chime_account_type,
    pp.name AS platform_name,
    g.name AS game_name,
    p.name AS operator_name
FROM transactions t
LEFT JOIN chime_accounts ca ON t.chime_account_id = ca.id
LEFT JOIN payment_platforms pp ON t.payment_platform_id = pp.id
LEFT JOIN games g ON t.game_id = g.id
LEFT JOIN profiles p ON t.operator_id = p.id
WHERE t.deleted_at IS NULL
  AND t.created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
ORDER BY t.created_at DESC;

-- ============================================
-- 4. ACTIVE GAMES LIST
-- Used on: Quick Transaction game dropdown
-- ============================================

SELECT id, name, tag
FROM games
WHERE deleted_at IS NULL
  AND status = 'active'
ORDER BY name;

-- ============================================
-- 5. ACTIVE PAYMENT PLATFORMS
-- Used on: Quick Transaction source cards
-- ============================================

SELECT id, name, tag, deposit_url, withdraw_url
FROM payment_platforms
WHERE deleted_at IS NULL
  AND status = 'active'
ORDER BY name;

-- ============================================
-- 6. CHECK REMAINING LIMIT FOR SPECIFIC ACCOUNT
-- Used on: Pre-submit validation (client-side preview)
-- ============================================

SELECT 
    ca.id,
    ca.nickname,
    ca.monthly_in_limit,
    ca.monthly_out_limit,
    COALESCE(SUM(CASE WHEN t.direction = 'deposit' THEN t.amount END), 0) AS used_in,
    COALESCE(SUM(CASE WHEN t.direction = 'withdraw' THEN t.amount END), 0) AS used_out,
    ca.monthly_in_limit - COALESCE(SUM(CASE WHEN t.direction = 'deposit' THEN t.amount END), 0) AS remaining_in,
    ca.monthly_out_limit - COALESCE(SUM(CASE WHEN t.direction = 'withdraw' THEN t.amount END), 0) AS remaining_out
FROM chime_accounts ca
LEFT JOIN transactions t ON t.chime_account_id = ca.id
    AND t.deleted_at IS NULL
    AND t.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
WHERE ca.id = 'your-account-id-here'
  AND ca.deleted_at IS NULL
GROUP BY ca.id;

-- ============================================
-- 7. MONTHLY SUMMARY BY ACCOUNT
-- Used on: Reports, Accounts overview
-- ============================================

SELECT get_monthly_account_summary();

-- ============================================
-- 8. OPERATOR'S OWN TRANSACTIONS
-- Used on: "My Transactions" view
-- ============================================

SELECT 
    t.*,
    ca.nickname AS chime_account_name,
    pp.name AS platform_name,
    g.name AS game_name
FROM transactions t
LEFT JOIN chime_accounts ca ON t.chime_account_id = ca.id
LEFT JOIN payment_platforms pp ON t.payment_platform_id = pp.id
LEFT JOIN games g ON t.game_id = g.id
WHERE t.deleted_at IS NULL
  AND t.operator_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
ORDER BY t.created_at DESC
LIMIT 50;

-- ============================================
-- 9. TRANSACTIONS BY DATE RANGE
-- Used on: History page with filters
-- ============================================

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
  AND t.created_at >= '2026-02-01 00:00:00 UTC'  -- start date
  AND t.created_at < '2026-03-01 00:00:00 UTC'   -- end date
ORDER BY t.created_at DESC;

-- ============================================
-- 10. TRANSACTION CREATION VIA RPC
-- Used on: Quick Transaction submit
-- ============================================

-- Deposit example
SELECT create_transaction_with_limit_check(
    p_direction := 'deposit',
    p_amount := 50.00,
    p_source_type := 'chime',
    p_chime_account_id := 'a1111111-1111-1111-1111-111111111111',
    p_game_id := 'g1111111-1111-1111-1111-111111111111',
    p_notes := 'Customer deposit'
);

-- Withdrawal example
SELECT create_transaction_with_limit_check(
    p_direction := 'withdraw',
    p_amount := 25.00,
    p_source_type := 'chime',
    p_chime_account_id := 'a1111111-1111-1111-1111-111111111111',
    p_withdraw_subtype := 'normal',
    p_notes := 'Payout'
);

-- ATM withdrawal example
SELECT create_transaction_with_limit_check(
    p_direction := 'withdraw',
    p_amount := 100.00,
    p_source_type := 'chime',
    p_chime_account_id := 'a1111111-1111-1111-1111-111111111111',
    p_withdraw_subtype := 'atm'
);

-- Platform deposit example
SELECT create_transaction_with_limit_check(
    p_direction := 'deposit',
    p_amount := 200.00,
    p_source_type := 'platform',
    p_payment_platform_id := 'p1111111-1111-1111-1111-111111111111',
    p_game_id := 'g2222222-2222-2222-2222-222222222222'
);

-- ============================================
-- 11. SOFT DELETE TRANSACTION
-- ============================================

SELECT soft_delete_transaction('transaction-id-here');
