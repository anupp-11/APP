-- ============================================
-- MIGRATION 007: Update platform balance on transactions
-- Fixes the create_transaction_with_limit_check to update platform balance
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
    v_account chime_accounts%ROWTYPE;
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
    
    -- ========================================
    -- UPDATE PLATFORM BALANCE (if platform transaction)
    -- Deposit = money going INTO platform = increase balance
    -- Withdraw = money going OUT of platform = decrease balance
    -- ========================================
    IF p_source_type = 'platform' AND p_payment_platform_id IS NOT NULL THEN
        IF p_direction = 'deposit' THEN
            UPDATE payment_platforms
            SET balance = balance + p_amount,
                updated_at = NOW()
            WHERE id = p_payment_platform_id;
        ELSE
            UPDATE payment_platforms
            SET balance = balance - p_amount,
                updated_at = NOW()
            WHERE id = p_payment_platform_id;
        END IF;
    END IF;
    
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
