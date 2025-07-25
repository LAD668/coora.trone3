/*
  # Link Access Codes to Clubs and Teams

  1. Schema Changes
    - Add club_id and team_id columns to access_codes table
    - Add foreign key constraints
    - Add NOT NULL constraint for club_id (all codes must belong to a club)

  2. Data Migration
    - Handle existing access codes by assigning them to a default club
    - Ensure data integrity before adding constraints

  3. Validation
    - Use trigger-based validation instead of CHECK constraint with subquery
    - Ensure team belongs to the same club if specified

  4. Security
    - Update RLS policies for club-based access control
    - Add helper function for access code validation

  5. Performance
    - Add appropriate indexes for better query performance
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

-- First, let's see if we have any clubs to work with
-- If no clubs exist, we'll create a default one for existing access codes
DO $$
DECLARE
  default_club_id uuid;
  club_count integer;
BEGIN
  -- Check if any clubs exist
  SELECT COUNT(*) INTO club_count FROM clubs;
  
  -- If no clubs exist, create a default one
  IF club_count = 0 THEN
    INSERT INTO clubs (name, description) 
    VALUES ('Default Club', 'Default club for existing access codes')
    RETURNING id INTO default_club_id;
    
    -- Update existing access codes to use the default club
    UPDATE access_codes 
    SET club_id = default_club_id 
    WHERE club_id IS NULL;
  ELSE
    -- If clubs exist, get the first one and assign orphaned codes to it
    SELECT id INTO default_club_id FROM clubs LIMIT 1;
    
    UPDATE access_codes 
    SET club_id = default_club_id 
    WHERE club_id IS NULL;
  END IF;
END $$;

-- Now we can safely add the constraint since all rows have club_id values
ALTER TABLE access_codes 
DROP CONSTRAINT IF EXISTS access_codes_club_required;

ALTER TABLE access_codes 
ADD CONSTRAINT access_codes_club_required 
CHECK (club_id IS NOT NULL);

-- Create a trigger function to validate team-club relationship
CREATE OR REPLACE FUNCTION validate_access_code_team_club()
RETURNS TRIGGER AS $$
BEGIN
  -- If team_id is specified, ensure it belongs to the same club
  IF NEW.team_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = NEW.team_id AND teams.club_id = NEW.club_id
    ) THEN
      RAISE EXCEPTION 'Team must belong to the same club as the access code';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate team-club relationship
DROP TRIGGER IF EXISTS validate_access_code_team_club_trigger ON access_codes;
CREATE TRIGGER validate_access_code_team_club_trigger
  BEFORE INSERT OR UPDATE ON access_codes
  FOR EACH ROW
  EXECUTE FUNCTION validate_access_code_team_club();

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