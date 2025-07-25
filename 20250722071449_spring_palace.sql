/*
  # Complete Team Management App Database Schema

  1. New Tables
    - `clubs` - Sports clubs/organizations
    - `teams` - Teams within clubs
    - `users` - User accounts with roles
    - `players` - Player profiles with stats
    - `player_stats` - Detailed player statistics
    - `posts` - Team announcements and updates
    - `post_reactions` - Emoji reactions to posts
    - `events` - Training sessions and matches
    - `event_responses` - Player responses to events
    - `match_results` - Match outcomes and statistics
    - `team_goals` - Team objectives and targets
    - `goal_tasks` - Tasks within team goals
    - `notifications` - System notifications
    - `access_codes` - Invitation codes for joining teams

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for role-based access
    - Secure data access based on club/team membership

  3. Functions
    - Helper functions for user permissions
    - Automatic triggers for stats updates
    - Notification scheduling
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

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport text DEFAULT 'Football',
  color text DEFAULT '#3B82F6',
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'trainer', 'player', 'parent')),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  access_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  phone_number text,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  jersey_number integer,
  date_of_birth date,
  height_cm integer,
  weight_kg integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season text DEFAULT EXTRACT(year FROM now())::text,
  goals integer DEFAULT 0,
  assists integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  trainings_attended integer DEFAULT 0,
  yellow_cards integer DEFAULT 0,
  red_cards integer DEFAULT 0,
  saves integer DEFAULT 0,
  clean_sheets integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, season)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  post_type text DEFAULT 'organization' CHECK (post_type IN ('organization', 'coach')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('training', 'match')),
  event_date timestamptz NOT NULL,
  meeting_time timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  location text NOT NULL,
  notes text,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requires_response boolean DEFAULT false,
  is_repeating boolean DEFAULT false,
  repeat_pattern jsonb,
  parent_event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_responses table
CREATE TABLE IF NOT EXISTS event_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response text DEFAULT 'pending' CHECK (response IN ('accepted', 'declined', 'pending')),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create match_results table
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_score integer DEFAULT 0,
  opponent_score integer DEFAULT 0,
  opponent_name text,
  match_outcome text GENERATED ALWAYS AS (
    CASE
      WHEN team_score > opponent_score THEN 'win'
      WHEN team_score < opponent_score THEN 'loss'
      ELSE 'draw'
    END
  ) STORED,
  goals jsonb DEFAULT '[]',
  assists jsonb DEFAULT '[]',
  other_stats jsonb DEFAULT '{}',
  submitted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_goals table
CREATE TABLE IF NOT EXISTS team_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline date NOT NULL,
  completed boolean DEFAULT false,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goal_tasks table
CREATE TABLE IF NOT EXISTS goal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES team_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL CHECK (notification_type IN ('post_match', 'event_reminder', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  read_by jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT access_codes_club_required CHECK (club_id IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_club_id ON teams(club_id);
CREATE INDEX IF NOT EXISTS idx_users_club_id ON users(club_id);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_posts_team_id ON posts(team_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_team_id ON events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_match_results_team_id ON match_results(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_team_id ON notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_club_id ON access_codes(club_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_team_id ON access_codes(team_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_access_codes_club_active ON access_codes(club_id, is_active, expires_at);

-- Helper function to get user's club ID
CREATE OR REPLACE FUNCTION get_user_club_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT club_id FROM users WHERE id = user_uuid;
$$;

-- Helper function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() = target_user_id THEN true
      WHEN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND club_id = (SELECT club_id FROM users WHERE id = target_user_id)
      ) THEN true
      ELSE false
    END;
$$;

-- Function to create player stats when a player is added
CREATE OR REPLACE FUNCTION create_player_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO player_stats (player_id, season)
  VALUES (NEW.id, EXTRACT(year FROM now())::text);
  RETURN NEW;
END;
$$;

-- Function to update player stats from match results
CREATE OR REPLACE FUNCTION update_player_stats_from_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal_record jsonb;
  assist_record jsonb;
  current_season text := EXTRACT(year FROM now())::text;
BEGIN
  -- Update goals
  FOR goal_record IN SELECT * FROM jsonb_array_elements(NEW.goals)
  LOOP
    UPDATE player_stats 
    SET 
      goals = goals + 1,
      matches_played = CASE WHEN matches_played = 0 THEN 1 ELSE matches_played END
    WHERE player_id = (goal_record->>'playerId')::uuid 
    AND season = current_season;
  END LOOP;

  -- Update assists
  FOR assist_record IN SELECT * FROM jsonb_array_elements(NEW.assists)
  LOOP
    UPDATE player_stats 
    SET assists = assists + 1
    WHERE player_id = (assist_record->>'playerId')::uuid 
    AND season = current_season;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Function to update goal progress based on completed tasks
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_progress integer;
  goal_id_var uuid;
BEGIN
  -- Get the goal_id from the trigger
  IF TG_OP = 'DELETE' THEN
    goal_id_var := OLD.goal_id;
  ELSE
    goal_id_var := NEW.goal_id;
  END IF;

  -- Count total and completed tasks
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_tasks, completed_tasks
  FROM goal_tasks 
  WHERE goal_id = goal_id_var;

  -- Calculate progress percentage
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::float / total_tasks::float) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update the goal progress and completion status
  UPDATE team_goals 
  SET 
    progress = new_progress,
    completed = (new_progress = 100)
  WHERE id = goal_id_var;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Function to schedule post-match notifications
CREATE OR REPLACE FUNCTION schedule_post_match_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create notification for match events
  IF NEW.event_type = 'match' THEN
    INSERT INTO notifications (
      notification_type,
      title,
      message,
      event_id,
      team_id,
      scheduled_for
    ) VALUES (
      'post_match',
      'Match Result Reminder',
      'Don''t forget to submit the match result for: ' || NEW.title,
      NEW.id,
      NEW.team_id,
      NEW.event_date + INTERVAL '3 hours'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to validate access code team/club relationship
CREATE OR REPLACE FUNCTION validate_access_code_team_club()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If team_id is provided, ensure it belongs to the specified club
  IF NEW.team_id IS NOT NULL AND NEW.club_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM teams 
      WHERE id = NEW.team_id AND club_id = NEW.club_id
    ) THEN
      RAISE EXCEPTION 'Team does not belong to the specified club';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS create_player_stats_trigger ON players;
CREATE TRIGGER create_player_stats_trigger
  AFTER INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_stats();

DROP TRIGGER IF EXISTS update_player_stats_trigger ON match_results;
CREATE TRIGGER update_player_stats_trigger
  AFTER INSERT OR UPDATE ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();

DROP TRIGGER IF EXISTS update_goal_progress_trigger ON goal_tasks;
CREATE TRIGGER update_goal_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON goal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

DROP TRIGGER IF EXISTS schedule_post_match_notification_trigger ON events;
CREATE TRIGGER schedule_post_match_notification_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION schedule_post_match_notification();

DROP TRIGGER IF EXISTS validate_access_code_team_club_trigger ON access_codes;
CREATE TRIGGER validate_access_code_team_club_trigger
  BEFORE INSERT OR UPDATE ON access_codes
  FOR EACH ROW
  EXECUTE FUNCTION validate_access_code_team_club();

-- Enable Row Level Security on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Clubs policies
CREATE POLICY "Users can view their club" ON clubs
  FOR SELECT TO authenticated
  USING (id IN (SELECT club_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can update their club" ON clubs
  FOR UPDATE TO authenticated
  USING (id IN (SELECT club_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Teams policies
CREATE POLICY "Users can view club teams" ON teams
  FOR SELECT TO authenticated
  USING (club_id = get_user_club_id(auth.uid()));

CREATE POLICY "Admins can manage all club teams" ON teams
  FOR ALL TO authenticated
  USING (club_id = get_user_club_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Trainers can update their team" ON teams
  FOR UPDATE TO authenticated
  USING (id IN (SELECT team_id FROM users WHERE id = auth.uid() AND role = 'trainer'));

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO authenticated
  USING (check_user_permission(id));

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE TO authenticated
  USING (check_user_permission(id))
  WITH CHECK (check_user_permission(id));

CREATE POLICY "Users can delete their own data" ON users
  FOR DELETE TO authenticated
  USING (check_user_permission(id));

-- Players policies
CREATE POLICY "Users can view club players" ON players
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM teams WHERE club_id = get_user_club_id(auth.uid())));

CREATE POLICY "Admins can manage all club players" ON players
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team players" ON players
  FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid() AND role = 'trainer'));

-- Player stats policies
CREATE POLICY "Users can view club player stats" ON player_stats
  FOR SELECT TO authenticated
  USING (player_id IN (
    SELECT p.id FROM players p
    JOIN teams t ON t.id = p.team_id
    WHERE t.club_id = get_user_club_id(auth.uid())
  ));

CREATE POLICY "Admins and trainers can manage player stats" ON player_stats
  FOR ALL TO authenticated
  USING (player_id IN (
    SELECT p.id FROM players p
    JOIN teams t ON t.id = p.team_id
    JOIN users u ON (u.club_id = t.club_id AND u.role = 'admin') OR (u.team_id = t.id AND u.role = 'trainer')
    WHERE u.id = auth.uid()
  ));

-- Posts policies
CREATE POLICY "Users can view club posts" ON posts
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM teams WHERE club_id = get_user_club_id(auth.uid())));

CREATE POLICY "Authors can manage their posts" ON posts
  FOR ALL TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins and trainers can create posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON (u.club_id = t.club_id AND u.role = 'admin') OR (u.team_id = t.id AND u.role = 'trainer')
    WHERE u.id = auth.uid()
  ));

-- Post reactions policies
CREATE POLICY "Users can view team post reactions" ON post_reactions
  FOR SELECT TO authenticated
  USING (post_id IN (
    SELECT p.id FROM posts p
    JOIN teams t ON t.id = p.team_id
    WHERE t.club_id = get_user_club_id(auth.uid())
  ));

CREATE POLICY "Users can manage their own reactions" ON post_reactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Events policies
CREATE POLICY "Users can view club events" ON events
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM teams WHERE club_id = get_user_club_id(auth.uid())));

CREATE POLICY "Admins can manage all club events" ON events
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team events" ON events
  FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid() AND role = 'trainer'));

-- Event responses policies
CREATE POLICY "Users can view team event responses" ON event_responses
  FOR SELECT TO authenticated
  USING (event_id IN (
    SELECT e.id FROM events e
    JOIN teams t ON t.id = e.team_id
    WHERE t.club_id = get_user_club_id(auth.uid())
  ));

CREATE POLICY "Users can manage their own responses" ON event_responses
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Match results policies
CREATE POLICY "Users can view club match results" ON match_results
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM teams WHERE club_id = get_user_club_id(auth.uid())));

CREATE POLICY "Admins can manage all club match results" ON match_results
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team match results" ON match_results
  FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid() AND role = 'trainer'));

-- Team goals policies
CREATE POLICY "Users can view club team goals" ON team_goals
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM teams WHERE club_id = get_user_club_id(auth.uid())));

CREATE POLICY "Admins can manage all club team goals" ON team_goals
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team goals" ON team_goals
  FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid() AND role = 'trainer'));

-- Goal tasks policies
CREATE POLICY "Users can view team goal tasks" ON goal_tasks
  FOR SELECT TO authenticated
  USING (goal_id IN (
    SELECT g.id FROM team_goals g
    JOIN teams t ON t.id = g.team_id
    WHERE t.club_id = get_user_club_id(auth.uid())
  ));

CREATE POLICY "Trainers and admins can manage goal tasks" ON goal_tasks
  FOR ALL TO authenticated
  USING (goal_id IN (
    SELECT g.id FROM team_goals g
    JOIN users u ON u.team_id = g.team_id
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'trainer')
  ));

-- Notifications policies
CREATE POLICY "Users can view club notifications" ON notifications
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM teams WHERE club_id = get_user_club_id(auth.uid())));

CREATE POLICY "Admins can manage all club notifications" ON notifications
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON u.club_id = t.club_id
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "Trainers can manage their team notifications" ON notifications
  FOR ALL TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid() AND role = 'trainer'));

-- Access codes policies
CREATE POLICY "Anyone can view active access codes" ON access_codes
  FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage access codes" ON access_codes
  FOR ALL TO authenticated
  USING (club_id = get_user_club_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));