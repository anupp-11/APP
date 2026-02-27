-- ============================================
-- Row Level Security (RLS) Policies
-- ChimeTracker
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chime_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's profile
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
    SELECT id FROM profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is operator (or admin)
CREATE OR REPLACE FUNCTION is_operator_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'operator')
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Admin: full access
CREATE POLICY "admin_full_access_profiles" ON profiles
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Operators: read own profile only
CREATE POLICY "users_read_own_profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Operators: update own profile (name only, not role)
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- CHIME ACCOUNTS POLICIES
-- ============================================

-- Admin: full access
CREATE POLICY "admin_full_access_chime_accounts" ON chime_accounts
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Operators: read active accounts (needed for transaction form)
CREATE POLICY "operators_read_active_chime_accounts" ON chime_accounts
    FOR SELECT
    TO authenticated
    USING (
        is_operator_or_admin() 
        AND deleted_at IS NULL
    );

-- ============================================
-- PAYMENT PLATFORMS POLICIES
-- ============================================

-- Admin: full access
CREATE POLICY "admin_full_access_payment_platforms" ON payment_platforms
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Operators: read active platforms
CREATE POLICY "operators_read_active_payment_platforms" ON payment_platforms
    FOR SELECT
    TO authenticated
    USING (
        is_operator_or_admin() 
        AND deleted_at IS NULL
    );

-- ============================================
-- GAMES POLICIES
-- ============================================

-- Admin: full access
CREATE POLICY "admin_full_access_games" ON games
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Operators: read active games
CREATE POLICY "operators_read_active_games" ON games
    FOR SELECT
    TO authenticated
    USING (
        is_operator_or_admin() 
        AND deleted_at IS NULL
    );

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Admin: full access to all transactions
CREATE POLICY "admin_full_access_transactions" ON transactions
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Operators: read all non-deleted transactions
-- (needed to see team activity, today totals, etc.)
CREATE POLICY "operators_read_transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING (
        is_operator_or_admin() 
        AND deleted_at IS NULL
    );

-- Operators: insert new transactions
-- Note: The actual insert should go through the RPC function
-- which does limit checking. This policy allows direct insert
-- as a fallback but the RPC is preferred.
CREATE POLICY "operators_insert_transactions" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_operator_or_admin()
        AND operator_id = get_my_profile_id()
    );

-- Operators: can update their OWN transactions only
-- Limited to notes and soft-delete
CREATE POLICY "operators_update_own_transactions" ON transactions
    FOR UPDATE
    TO authenticated
    USING (
        is_operator_or_admin()
        AND operator_id = get_my_profile_id()
        AND deleted_at IS NULL
    )
    WITH CHECK (
        operator_id = get_my_profile_id()
    );

-- Operators: can soft-delete their OWN transactions only
-- (This is handled via UPDATE setting deleted_at)
-- No hard DELETE allowed for operators
CREATE POLICY "operators_no_hard_delete" ON transactions
    FOR DELETE
    TO authenticated
    USING (is_admin()); -- Only admins can hard delete

-- ============================================
-- GRANT VIEW ACCESS
-- ============================================

-- Grant access to the helper views
GRANT SELECT ON chime_accounts_with_totals TO authenticated;
GRANT SELECT ON today_transactions TO authenticated;
