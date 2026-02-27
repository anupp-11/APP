-- ============================================
-- Add balance to payment_platforms
-- ============================================

-- Add balance column to track current platform balance
ALTER TABLE payment_platforms 
ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0.00;

-- Make tag optional (was required before)
ALTER TABLE payment_platforms 
ALTER COLUMN tag DROP NOT NULL;
