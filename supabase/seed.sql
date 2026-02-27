-- ============================================
-- SEED DATA
-- Initial data for development/testing
-- ============================================

-- ============================================
-- CHIME ACCOUNTS
-- ============================================

INSERT INTO chime_accounts (id, nickname, type, status, monthly_in_limit, monthly_out_limit, atm_withdrawal_enabled)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Primary Holding', 'holding', 'active', 2000.00, 2000.00, true),
    ('a2222222-2222-2222-2222-222222222222', 'Operations Alpha', 'paying', 'active', 1500.00, 1500.00, false),
    ('a3333333-3333-3333-3333-333333333333', 'Reserve Account', 'holding', 'active', 3000.00, 2500.00, true),
    ('a4444444-4444-4444-4444-444444444444', 'Backup Pay', 'paying', 'active', 1000.00, 1000.00, false),
    ('a5555555-5555-5555-5555-555555555555', 'Legacy Account', 'holding', 'inactive', 500.00, 500.00, false);

-- ============================================
-- PAYMENT PLATFORMS
-- ============================================

INSERT INTO payment_platforms (id, name, tag, deposit_url, withdraw_url, status)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'Platform Today', 'platform_today', 'https://platformtoday.com/deposit', 'https://platformtoday.com/withdraw', 'active'),
    ('p2222222-2222-2222-2222-222222222222', 'Solar Payment', 'solar', 'https://solarpay.com/in', 'https://solarpay.com/out', 'active');

-- ============================================
-- GAMES
-- ============================================

INSERT INTO games (id, name, tag, status)
VALUES
    ('g1111111-1111-1111-1111-111111111111', 'Slots Paradise', 'slots_paradise', 'active'),
    ('g2222222-2222-2222-2222-222222222222', 'Poker Masters', 'poker_masters', 'active'),
    ('g3333333-3333-3333-3333-333333333333', 'Blackjack Elite', 'blackjack_elite', 'active'),
    ('g4444444-4444-4444-4444-444444444444', 'Roulette Royale', 'roulette_royale', 'active'),
    ('g5555555-5555-5555-5555-555555555555', 'Lucky Dice', 'lucky_dice', 'active'),
    ('g6666666-6666-6666-6666-666666666666', 'Sports Bet Pro', 'sports_bet_pro', 'active'),
    ('g7777777-7777-7777-7777-777777777777', 'Casino Stars', 'casino_stars', 'active'),
    ('g8888888-8888-8888-8888-888888888888', 'Golden Jackpot', 'golden_jackpot', 'active'),
    ('g9999999-9999-9999-9999-999999999999', 'Fantasy League', 'fantasy_league', 'inactive'),
    ('gaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bingo Blast', 'bingo_blast', 'active');

-- ============================================
-- Note: Profiles are created when users sign up
-- For testing, you can manually insert:
--
-- INSERT INTO profiles (user_id, role, name)
-- VALUES 
--     ('your-supabase-auth-user-id', 'admin', 'Admin User'),
--     ('another-user-id', 'operator', 'Operator 1');
-- ============================================
