-- Temporary fix for RLS policy violation in development
-- Run this in your Supabase SQL editor

-- Option 1: Create the development user in auth.users table
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'dev@roosterscan.com',
    '$2a$10$dummy.hash.for.development.only',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Option 2: Temporarily disable RLS for scans table (for development only)
-- ALTER TABLE scans DISABLE ROW LEVEL SECURITY;

-- Option 3: Create a more permissive policy for development
DROP POLICY IF EXISTS "Users can manage own scans" ON scans;
CREATE POLICY "Users can manage own scans" ON scans FOR ALL 
USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid
);
