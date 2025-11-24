-- Temporarily disable RLS for scans table in development
-- Run this in your Supabase SQL Editor

ALTER TABLE scans DISABLE ROW LEVEL SECURITY;

-- Optional: Check if the development user was created
SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- You can re-enable RLS later with:
-- ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
