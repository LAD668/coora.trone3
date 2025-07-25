/*
  # Platform Structure Improvement: Clubs, Teams, and Users

  1. New Tables
    - `clubs`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `logo_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modified Tables
    - `teams` - Add club_id foreign key
    - `users` - Add club_id foreign key, update role constraints

  3. Security
    - Enable RLS on all tables
    - Add policies for club-based access control
    - Update existing policies to work with new structure

  4. Role Structure
    - Admin: Connected to club only, can manage all teams in club
    - Trainer: Connected to specific team and club
    - Player/Parent: Connected to specific team and club
*/

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add club_id to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'club_id'
  ) THEN
    ALTER TABLE teams ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add club_id to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'club_id'
  ) THEN
    ALTER TABLE users ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update users role constraint to be more specific
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'trainer'::text, 'player'::text, 'parent'::text]));

-- Enable RLS on clubs table
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_club_id ON teams(club_id);
CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id);

-- RLS Policies for clubs table
CREATE POLICY "Users can view their club" ON clubs
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT club_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can update their club" ON clubs
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT club_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Update teams table policies
DROP POLICY IF EXISTS "Admins and trainers can update their team" ON teams;
DROP POLICY IF EXISTS "Users can view their own team" ON teams;

CREATE POLICY "Users can view club teams" ON teams
  FOR SELECT TO authenticated
  USING (club_id IN (
    SELECT club_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage all club teams" ON teams
  FOR ALL TO authenticated
  USING (club_id IN (
    SELECT club_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Trainers can update their team" ON teams
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role = 'trainer'
  ));

-- Update users table policies
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view team members" ON users;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view club members" ON users
  FOR SELECT TO authenticated
  USING (club_id IN (
    SELECT club_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage club users" ON users
  FOR ALL TO authenticated
  USING (club_id IN (
    SELECT club_id FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Update players table policies
DROP POLICY IF EXISTS "Trainers and admins can manage players" ON players;
DROP POLICY IF EXISTS "Users can view team players" ON players;

CREATE POLICY "Users can view club players" ON players
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all club players" ON players
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team players" ON players
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role = 'trainer'
  ));

-- Update player_stats table policies
DROP POLICY IF EXISTS "System can update player stats" ON player_stats;
DROP POLICY IF EXISTS "Users can view team player stats" ON player_stats;

CREATE POLICY "Users can view club player stats" ON player_stats
  FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT p.id FROM players p
    JOIN teams t ON t.id = p.team_id
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins and trainers can manage player stats" ON player_stats
  FOR ALL TO authenticated
  USING (player_id IN (
    SELECT p.id FROM players p
    JOIN teams t ON t.id = p.team_id
    JOIN users u ON (u.club_id = t.club_id AND u.role = 'admin') 
                 OR (u.team_id = t.id AND u.role = 'trainer')
    WHERE u.id = auth.uid()
  ));

-- Update posts table policies
DROP POLICY IF EXISTS "Authors can delete their posts" ON posts;
DROP POLICY IF EXISTS "Authors can update their posts" ON posts;
DROP POLICY IF EXISTS "Trainers and admins can create posts" ON posts;
DROP POLICY IF EXISTS "Users can view team posts" ON posts;

CREATE POLICY "Users can view club posts" ON posts
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Authors can manage their posts" ON posts
  FOR ALL TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins and trainers can create posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON (u.club_id = t.club_id AND u.role = 'admin')
                 OR (u.team_id = t.id AND u.role = 'trainer')
    WHERE u.id = auth.uid()
  ));

-- Update events table policies
DROP POLICY IF EXISTS "Trainers and admins can manage events" ON events;
DROP POLICY IF EXISTS "Users can view team events" ON events;

CREATE POLICY "Users can view club events" ON events
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all club events" ON events
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team events" ON events
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role = 'trainer'
  ));

-- Update match_results table policies
DROP POLICY IF EXISTS "Trainers and admins can manage match results" ON match_results;
DROP POLICY IF EXISTS "Users can view team match results" ON match_results;

CREATE POLICY "Users can view club match results" ON match_results
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all club match results" ON match_results
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team match results" ON match_results
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role = 'trainer'
  ));

-- Update team_goals table policies
DROP POLICY IF EXISTS "Trainers and admins can manage team goals" ON team_goals;
DROP POLICY IF EXISTS "Users can view team goals" ON team_goals;

CREATE POLICY "Users can view club team goals" ON team_goals
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all club team goals" ON team_goals
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team goals" ON team_goals
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role = 'trainer'
  ));

-- Update notifications table policies
DROP POLICY IF EXISTS "System can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view team notifications" ON notifications;

CREATE POLICY "Users can view club notifications" ON notifications
  FOR SELECT TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Admins can manage all club notifications" ON notifications
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team notifications" ON notifications
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role = 'trainer'
  ));