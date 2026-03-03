-- ============================================
-- MIGRATION 014: Fix ATM withdrawals RLS policy
-- The recorded_by column stores profile ID, not auth.uid()
-- ============================================

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can update own ATM withdrawals" ON atm_withdrawals;

-- Create corrected policy that looks up profile ID from auth.uid()
CREATE POLICY "Users can update own ATM withdrawals"
    ON atm_withdrawals FOR UPDATE
    TO authenticated
    USING (
        recorded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        recorded_by IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Also add a policy for admins to update any ATM withdrawal
CREATE POLICY "Admins can update any ATM withdrawals"
    ON atm_withdrawals FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
