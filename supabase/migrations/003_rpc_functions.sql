-- ============================================
-- RPC FUNCTIONS
-- Server-side transaction creation with limit enforcement
-- ============================================

-- ============================================
-- CREATE TRANSACTION WITH LIMIT CHECK
-- Main RPC for inserting transactions safely
-- ============================================

CREATE OR REPLACE FUNCTION create_transaction_with_limit_check(
    p_direction transaction_direction,
    p_amount NUMERIC(12,2),
    p_source_type source_type,
    p_chime_account_id UUID DEFAULT NULL,
    p_payment_platform_id UUID DEFAULT NULL,
    p_game_id UUID DEFAULT NULL,
    p_withdraw_subtype withdraw_subtype DEFAULT 'normal',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operator_id UUID;
    v_account RECORD;
    v_current_month_total NUMERIC(12,2);
    v_new_total NUMERIC(12,2);
    v_limit NUMERIC(12,2);
    v_remaining NUMERIC(12,2);
    v_new_transaction_id UUID;
    v_month_start TIMESTAMPTZ;
BEGIN
    -- Get operator profile ID
    SELECT id INTO v_operator_id 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF v_operator_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'User profile not found'
        );
    END IF;
    
    -- Validate amount
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INVALID_AMOUNT',
            'message', 'Amount must be greater than zero'
        );
    END IF;
    
    -- Validate source type matches provided IDs
    IF p_source_type = 'chime' AND p_chime_account_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'MISSING_CHIME_ACCOUNT',
            'message', 'Chime account ID is required for chime source type'
        );
    END IF;
    
    IF p_source_type = 'platform' AND p_payment_platform_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'MISSING_PLATFORM',
            'message', 'Payment platform ID is required for platform source type'
        );
    END IF;
    
    -- Validate deposit requires game
    IF p_direction = 'deposit' AND p_game_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'MISSING_GAME',
            'message', 'Game is required for deposits'
        );
    END IF;
    
    -- Current month start (UTC)
    v_month_start := DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC');
    
    -- ========================================
    -- CHIME SOURCE: Enforce limits
    -- ========================================
    IF p_source_type = 'chime' THEN
        -- Get chime account details
        SELECT * INTO v_account
        FROM chime_accounts
        WHERE id = p_chime_account_id
          AND deleted_at IS NULL;
        
        IF v_account IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'ACCOUNT_NOT_FOUND',
                'message', 'Chime account not found or has been deleted'
            );
        END IF;
        
        IF v_account.status != 'active' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'ACCOUNT_INACTIVE',
                'message', 'Chime account is inactive'
            );
        END IF;
        
        -- Check ATM withdrawal rule
        -- ATM withdrawals only allowed from holding accounts with atm_withdrawal_enabled
        IF p_direction = 'withdraw' AND p_withdraw_subtype = 'atm' THEN
            IF v_account.type != 'holding' THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'ATM_NOT_ALLOWED',
                    'message', 'ATM withdrawals are only allowed from holding accounts'
                );
            END IF;
            
            IF NOT v_account.atm_withdrawal_enabled THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'ATM_NOT_ENABLED',
                    'message', 'ATM withdrawals are not enabled for this account'
                );
            END IF;
        END IF;
        
        -- Calculate current month total for this direction
        SELECT COALESCE(SUM(amount), 0) INTO v_current_month_total
        FROM transactions
        WHERE chime_account_id = p_chime_account_id
          AND direction = p_direction
          AND deleted_at IS NULL
          AND created_at >= v_month_start;
        
        -- Determine limit based on direction
        IF p_direction = 'deposit' THEN
            v_limit := v_account.monthly_in_limit;
        ELSE
            v_limit := v_account.monthly_out_limit;
        END IF;
        
        -- Calculate new total
        v_new_total := v_current_month_total + p_amount;
        v_remaining := v_limit - v_current_month_total;
        
        -- Check if transaction would exceed limit
        IF v_new_total > v_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'LIMIT_EXCEEDED',
                'message', format(
                    'Transaction would exceed monthly %s limit. Current: $%s, Limit: $%s, Remaining: $%s, Requested: $%s',
                    CASE WHEN p_direction = 'deposit' THEN 'IN' ELSE 'OUT' END,
                    v_current_month_total,
                    v_limit,
                    v_remaining,
                    p_amount
                ),
                'current_total', v_current_month_total,
                'limit', v_limit,
                'remaining', v_remaining,
                'requested', p_amount
            );
        END IF;
    END IF;
    
    -- ========================================
    -- PLATFORM SOURCE: Validate exists
    -- ========================================
    IF p_source_type = 'platform' THEN
        IF NOT EXISTS (
            SELECT 1 FROM payment_platforms
            WHERE id = p_payment_platform_id
              AND deleted_at IS NULL
              AND status = 'active'
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'PLATFORM_NOT_FOUND',
                'message', 'Payment platform not found or inactive'
            );
        END IF;
    END IF;
    
    -- ========================================
    -- VALIDATE GAME EXISTS (if provided)
    -- ========================================
    IF p_game_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM games
            WHERE id = p_game_id
              AND deleted_at IS NULL
              AND status = 'active'
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'GAME_NOT_FOUND',
                'message', 'Game not found or inactive'
            );
        END IF;
    END IF;
    
    -- ========================================
    -- INSERT TRANSACTION
    -- ========================================
    INSERT INTO transactions (
        operator_id,
        direction,
        amount,
        source_type,
        chime_account_id,
        payment_platform_id,
        game_id,
        withdraw_subtype,
        notes,
        created_at
    ) VALUES (
        v_operator_id,
        p_direction,
        p_amount,
        p_source_type,
        CASE WHEN p_source_type = 'chime' THEN p_chime_account_id ELSE NULL END,
        CASE WHEN p_source_type = 'platform' THEN p_payment_platform_id ELSE NULL END,
        p_game_id,
        CASE WHEN p_direction = 'withdraw' THEN p_withdraw_subtype ELSE NULL END,
        p_notes,
        NOW() AT TIME ZONE 'UTC'
    )
    RETURNING id INTO v_new_transaction_id;
    
    -- Return success with new transaction ID
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_new_transaction_id,
        'message', format('%s recorded successfully', INITCAP(p_direction::text))
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'DATABASE_ERROR',
        'message', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_transaction_with_limit_check TO authenticated;

-- ============================================
-- SOFT DELETE TRANSACTION
-- RPC for operators to delete their own transactions
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_transaction(
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operator_id UUID;
    v_transaction RECORD;
BEGIN
    -- Get operator profile ID
    SELECT id INTO v_operator_id 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF v_operator_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'UNAUTHORIZED',
            'message', 'User profile not found'
        );
    END IF;
    
    -- Get transaction
    SELECT * INTO v_transaction
    FROM transactions
    WHERE id = p_transaction_id
      AND deleted_at IS NULL;
    
    IF v_transaction IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_FOUND',
            'message', 'Transaction not found or already deleted'
        );
    END IF;
    
    -- Check ownership (unless admin)
    IF v_transaction.operator_id != v_operator_id AND NOT is_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'FORBIDDEN',
            'message', 'You can only delete your own transactions'
        );
    END IF;
    
    -- Soft delete
    UPDATE transactions
    SET deleted_at = NOW(),
        deleted_by = v_operator_id
    WHERE id = p_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Transaction deleted successfully'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_transaction TO authenticated;

-- ============================================
-- GET QUICK TRANSACTION DATA
-- Single RPC to fetch all data needed for quick transaction form
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
    
    -- Get active payment platforms
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', pp.id,
            'name', pp.name,
            'tag', pp.tag,
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

GRANT EXECUTE ON FUNCTION get_quick_transaction_data TO authenticated;

-- ============================================
-- GET TODAY SUMMARY
-- Quick stats for dashboard header
-- ============================================

CREATE OR REPLACE FUNCTION get_today_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_total_deposits NUMERIC(12,2);
    v_total_withdrawals NUMERIC(12,2);
    v_transaction_count INTEGER;
BEGIN
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    
    SELECT 
        COALESCE(SUM(CASE WHEN direction = 'deposit' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN direction = 'withdraw' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_deposits, v_total_withdrawals, v_transaction_count
    FROM transactions
    WHERE deleted_at IS NULL
      AND created_at >= v_today_start;
    
    RETURN jsonb_build_object(
        'today_deposits', v_total_deposits,
        'today_withdrawals', v_total_withdrawals,
        'today_net', v_total_deposits - v_total_withdrawals,
        'transaction_count', v_transaction_count,
        'date', CURRENT_DATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_today_summary TO authenticated;

-- ============================================
-- GET MONTHLY ACCOUNT SUMMARY
-- Detailed breakdown for accounts page
-- ============================================

CREATE OR REPLACE FUNCTION get_monthly_account_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_month_start TIMESTAMPTZ;
    v_accounts JSONB;
BEGIN
    v_month_start := DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC');
    
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', ca.id,
            'nickname', ca.nickname,
            'type', ca.type,
            'status', ca.status,
            'monthly_in_limit', ca.monthly_in_limit,
            'monthly_out_limit', ca.monthly_out_limit,
            'atm_withdrawal_enabled', ca.atm_withdrawal_enabled,
            'current_month_in', COALESCE(totals.month_in, 0),
            'current_month_out', COALESCE(totals.month_out, 0),
            'remaining_in', ca.monthly_in_limit - COALESCE(totals.month_in, 0),
            'remaining_out', ca.monthly_out_limit - COALESCE(totals.month_out, 0),
            'in_percentage', CASE 
                WHEN ca.monthly_in_limit > 0 
                THEN ROUND((COALESCE(totals.month_in, 0) / ca.monthly_in_limit) * 100, 1)
                ELSE 0 
            END,
            'out_percentage', CASE 
                WHEN ca.monthly_out_limit > 0 
                THEN ROUND((COALESCE(totals.month_out, 0) / ca.monthly_out_limit) * 100, 1)
                ELSE 0 
            END
        )
    ), '[]'::jsonb) INTO v_accounts
    FROM chime_accounts ca
    LEFT JOIN (
        SELECT 
            chime_account_id,
            SUM(CASE WHEN direction = 'deposit' THEN amount ELSE 0 END) AS month_in,
            SUM(CASE WHEN direction = 'withdraw' THEN amount ELSE 0 END) AS month_out
        FROM transactions
        WHERE deleted_at IS NULL
          AND created_at >= v_month_start
          AND chime_account_id IS NOT NULL
        GROUP BY chime_account_id
    ) totals ON totals.chime_account_id = ca.id
    WHERE ca.deleted_at IS NULL;
    
    RETURN jsonb_build_object(
        'accounts', v_accounts,
        'month', TO_CHAR(v_month_start, 'YYYY-MM'),
        'fetched_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_monthly_account_summary TO authenticated;
