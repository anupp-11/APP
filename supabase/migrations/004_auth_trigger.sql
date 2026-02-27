-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger to automatically create a profile when a user signs up
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_count INTEGER;
    v_role user_role;
BEGIN
    -- Count existing users to determine if this is the first user
    SELECT COUNT(*) INTO v_user_count FROM profiles;
    
    -- First user becomes admin, others become operators
    IF v_user_count = 0 THEN
        v_role := 'admin';
    ELSE
        v_role := 'operator';
    END IF;
    
    -- Create profile for new user
    INSERT INTO profiles (user_id, role, name)
    VALUES (
        NEW.id,
        v_role,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    
    RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- HELPER: Promote user to admin
-- Run this manually in SQL editor to make a user admin
-- ============================================

CREATE OR REPLACE FUNCTION promote_to_admin(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN 'User not found with email: ' || p_email;
    END IF;
    
    -- Update profile to admin
    UPDATE profiles
    SET role = 'admin'
    WHERE user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN 'Profile not found for user: ' || p_email;
    END IF;
    
    RETURN 'Successfully promoted ' || p_email || ' to admin';
END;
$$;

-- Only allow superuser/service_role to run this
REVOKE EXECUTE ON FUNCTION promote_to_admin FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION promote_to_admin FROM authenticated;
