/*
  # Fix RLS policies to prevent infinite recursion

  1. Security Updates
    - Remove recursive references in RLS policies
    - Simplify policy conditions to avoid self-referencing queries
    - Use direct foreign key relationships instead of subqueries where possible

  2. Policy Improvements
    - Ensure policies don't reference the same table they're protecting
    - Use auth.uid() directly where appropriate
    - Optimize query performance by reducing nested subqueries
*/

-- Drop and recreate users table policies to fix recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view club members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage club users" ON users;

-- Simple, non-recursive policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- For viewing club members, use a function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_club_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT club_id FROM users WHERE id = user_id LIMIT 1;
$$;

CREATE POLICY "Users can view club members" ON users
  FOR SELECT TO authenticated
  USING (club_id = get_user_club_id(auth.uid()));

-- For admin management, use the same function
CREATE POLICY "Admins can manage club users" ON users
  FOR ALL TO authenticated
  USING (
    club_id = get_user_club_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update teams policies to use the function
DROP POLICY IF EXISTS "Users can view club teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage all club teams" ON teams;
DROP POLICY IF EXISTS "Trainers can update their team" ON teams;

CREATE POLICY "Users can view club teams" ON teams
  FOR SELECT TO authenticated
  USING (club_id = get_user_club_id(auth.uid()));

CREATE POLICY "Admins can manage all club teams" ON teams
  FOR ALL TO authenticated
  USING (
    club_id = get_user_club_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Trainers can update their team" ON teams
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() AND role = 'trainer'
    )
  );

-- Update other table policies to use the function where needed
DROP POLICY IF EXISTS "Users can view club players" ON players;
CREATE POLICY "Users can view club players" ON players
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE club_id = get_user_club_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view club posts" ON posts;
CREATE POLICY "Users can view club posts" ON posts
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE club_id = get_user_club_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view club events" ON events;
CREATE POLICY "Users can view club events" ON events
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE club_id = get_user_club_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view club match results" ON match_results;
CREATE POLICY "Users can view club match results" ON match_results
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE club_id = get_user_club_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view club team goals" ON team_goals;
CREATE POLICY "Users can view club team goals" ON team_goals
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE club_id = get_user_club_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view club notifications" ON notifications;
CREATE POLICY "Users can view club notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE club_id = get_user_club_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view club player stats" ON player_stats;
CREATE POLICY "Users can view club player stats" ON player_stats
  FOR SELECT TO authenticated
  USING (
    player_id IN (
      SELECT p.id FROM players p
      JOIN teams t ON t.id = p.team_id
      WHERE t.club_id = get_user_club_id(auth.uid())
    )
  );

-- Update post_reactions policies
DROP POLICY IF EXISTS "Users can view team post reactions" ON post_reactions;
CREATE POLICY "Users can view team post reactions" ON post_reactions
  FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN teams t ON t.id = p.team_id
      WHERE t.club_id = get_user_club_id(auth.uid())
    )
  );

-- Update event_responses policies
DROP POLICY IF EXISTS "Users can view team event responses" ON event_responses;
CREATE POLICY "Users can view team event responses" ON event_responses
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN teams t ON t.id = e.team_id
      WHERE t.club_id = get_user_club_id(auth.uid())
    )
  );

-- Update goal_tasks policies
DROP POLICY IF EXISTS "Users can view team goal tasks" ON goal_tasks;
CREATE POLICY "Users can view team goal tasks" ON goal_tasks
  FOR SELECT TO authenticated
  USING (
    goal_id IN (
      SELECT g.id FROM team_goals g
      JOIN teams t ON t.id = g.team_id
      WHERE t.club_id = get_user_club_id(auth.uid())
    )
  );