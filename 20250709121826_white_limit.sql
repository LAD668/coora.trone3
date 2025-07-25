/*
  # Improve Access Codes System - Link to Clubs and Teams

  1. Schema Updates
    - Add club_id and team_id to access_codes table
    - Add constraints to ensure proper relationships
    - Update indexes for better performance

  2. Security Updates
    - Update RLS policies for new structure
    - Ensure proper access control

  3. Data Migration
    - Update existing access codes to be club-specific
*/

-- Add club_id and team_id columns to access_codes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_codes' AND column_name = 'club_id'
  ) THEN
    ALTER TABLE access_codes ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_codes' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE access_codes ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraint to ensure access codes are linked to at least a club
-- Team is optional - club-wide codes don't need a specific team
ALTER TABLE access_codes 
DROP CONSTRAINT IF EXISTS access_codes_club_required;

ALTER TABLE access_codes 
ADD CONSTRAINT access_codes_club_required 
CHECK (club_id IS NOT NULL);

-- Add constraint to ensure team belongs to the same club if specified
ALTER TABLE access_codes 
DROP CONSTRAINT IF EXISTS access_codes_team_club_match;

ALTER TABLE access_codes 
ADD CONSTRAINT access_codes_team_club_match 
CHECK (
  team_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_id AND teams.club_id = access_codes.club_id
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_club_id ON access_codes(club_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_team_id ON access_codes(team_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_club_active ON access_codes(club_id, is_active, expires_at);

-- Update RLS policies for access_codes
DROP POLICY IF EXISTS "Anyone can view active access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can manage access codes" ON access_codes;

-- Allow authenticated users to view active access codes (for validation during signup)
CREATE POLICY "Anyone can view active access codes" ON access_codes
  FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Allow admins to manage access codes for their club
CREATE POLICY "Admins can manage access codes" ON access_codes
  FOR ALL TO authenticated
  USING (
    club_id = get_user_club_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clear existing access codes since they don't have club associations
DELETE FROM access_codes WHERE club_id IS NULL;

-- Function to validate access code and return club/team info
CREATE OR REPLACE FUNCTION validate_access_code_with_info(code_input text)
RETURNS TABLE(
  is_valid boolean,
  club_id uuid,
  team_id uuid,
  club_name text,
  team_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN ac.id IS NOT NULL THEN true 
      ELSE false 
    END as is_valid,
    ac.club_id,
    ac.team_id,
    c.name as club_name,
    t.name as team_name
  FROM access_codes ac
  LEFT JOIN clubs c ON c.id = ac.club_id
  LEFT JOIN teams t ON t.id = ac.team_id
  WHERE ac.code = UPPER(code_input)
    AND ac.is_active = true
    AND (ac.expires_at IS NULL OR ac.expires_at > now())
  LIMIT 1;
$$;