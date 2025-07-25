/*
  # Enhance Users Table for Improved Authentication

  1. Schema Updates
    - Split name field into first_name and last_name
    - Add access_code field to track which code was used for registration
    - Update constraints and indexes

  2. Data Migration
    - Safely migrate existing name data to first_name/last_name
    - Handle existing users gracefully

  3. Security
    - Maintain existing RLS policies
    - Ensure data integrity during migration
*/

-- Add new columns to users table
DO $$
BEGIN
  -- Add first_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name text;
  END IF;

  -- Add last_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name text;
  END IF;

  -- Add access_code column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'access_code'
  ) THEN
    ALTER TABLE users ADD COLUMN access_code text;
  END IF;
END $$;

-- Migrate existing name data to first_name/last_name
UPDATE users 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 
    THEN split_part(name, ' ', 1)
    ELSE COALESCE(name, 'User')
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 
    THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Set default values for any remaining null values
UPDATE users 
SET 
  first_name = COALESCE(first_name, 'User'),
  last_name = COALESCE(last_name, '')
WHERE first_name IS NULL OR last_name IS NULL;

-- Add NOT NULL constraints after data migration
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;

-- Create a computed column for full name (for backward compatibility)
CREATE OR REPLACE FUNCTION get_full_name(first_name text, last_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(first_name || ' ' || last_name);
$$;

-- Add index for access_code lookups
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code);

-- Update getUserProfile function to include new fields
CREATE OR REPLACE FUNCTION get_user_profile_enhanced(user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  full_name text,
  role text,
  team_id uuid,
  club_id uuid,
  access_code text,
  created_at timestamptz,
  updated_at timestamptz,
  team_name text,
  team_sport text,
  team_color text,
  club_name text,
  club_description text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    get_full_name(u.first_name, u.last_name) as full_name,
    u.role,
    u.team_id,
    u.club_id,
    u.access_code,
    u.created_at,
    u.updated_at,
    t.name as team_name,
    t.sport as team_sport,
    t.color as team_color,
    c.name as club_name,
    c.description as club_description
  FROM users u
  LEFT JOIN teams t ON t.id = u.team_id
  LEFT JOIN clubs c ON c.id = u.club_id
  WHERE u.id = user_id;
$$;