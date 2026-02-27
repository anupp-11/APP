-- ============================================
-- MIGRATION 006: Update get_quick_transaction_data RPC
-- Adds deposit_url, withdraw_url, balance to payment_platforms
-- ============================================

CREATE OR REPLACE FUNCTION get_quick_transaction_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_chime_accounts JSONB;
    v_platforms JSONB;
    v_games JSONB;
    v_month_start TIMESTAMPTZ;
BEGIN
    v_month_start := DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC');
    
    -- Get chime accounts with current month totals
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', ca.id,
            'nickname', ca.nickname,
            'type', ca.type,
            'status', ca.status,
            'monthly_in_limit', ca.monthly_in_limit,
            'monthly_out_limit', ca.monthly_out_limit,
            'atm_withdrawal_enabled', ca.atm_withdrawal_enabled,
            'current_month_in', COALESCE(
                (SELECT SUM(t.amount) FROM transactions t 
                 WHERE t.chime_account_id = ca.id 
                 AND t.direction = 'deposit' 
                 AND t.deleted_at IS NULL 
                 AND t.created_at >= v_month_start), 0
            ),
            'current_month_out', COALESCE(
                (SELECT SUM(t.amount) FROM transactions t 
                 WHERE t.chime_account_id = ca.id 
                 AND t.direction = 'withdraw' 
                 AND t.deleted_at IS NULL 
                 AND t.created_at >= v_month_start), 0
            )
        )
    ), '[]'::jsonb) INTO v_chime_accounts
    FROM chime_accounts ca
    WHERE ca.deleted_at IS NULL;
    
    -- Get active payment platforms (now includes deposit_url, withdraw_url, balance)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', pp.id,
            'name', pp.name,
            'tag', pp.tag,
            'deposit_url', pp.deposit_url,
            'withdraw_url', pp.withdraw_url,
            'balance', COALESCE(pp.balance, 0),
            'status', pp.status
        )
    ), '[]'::jsonb) INTO v_platforms
    FROM payment_platforms pp
    WHERE pp.deleted_at IS NULL
      AND pp.status = 'active';
    
    -- Get active games
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', g.id,
            'name', g.name,
            'tag', g.tag
        )
    ), '[]'::jsonb) INTO v_games
    FROM games g
    WHERE g.deleted_at IS NULL
      AND g.status = 'active';
    
    RETURN jsonb_build_object(
        'chime_accounts', v_chime_accounts,
        'payment_platforms', v_platforms,
        'games', v_games,
        'fetched_at', NOW()
    );
END;
$$;
