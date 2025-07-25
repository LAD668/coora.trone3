/*
  # Team Management App Database Schema

  1. New Tables
    - `teams` - Team information and settings
    - `users` - User accounts with roles and team associations
    - `players` - Player profiles with stats and positions
    - `posts` - Info hub posts with reactions
    - `post_reactions` - User reactions to posts
    - `events` - Calendar events (training/matches)
    - `event_responses` - Player responses to training events
    - `match_results` - Match outcomes with detailed stats
    - `player_stats` - Individual player statistics
    - `team_goals` - Team objectives and progress tracking
    - `goal_tasks` - Tasks within team goals
    - `notifications` - System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for team-based access control
    - Ensure users can only access their team's data

  3. Features
    - Real-time subscriptions for posts and events
    - Automatic stat calculations
    - Notification scheduling
    - Team goal progress tracking
*/

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport text NOT NULL DEFAULT 'Football',
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'trainer', 'player', 'parent')),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  phone_number text,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  jersey_number integer,
  date_of_birth date,
  height_cm integer,
  weight_kg integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  season text DEFAULT EXTRACT(YEAR FROM now())::text,
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

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  post_type text NOT NULL CHECK (post_type IN ('organization', 'coach')) DEFAULT 'organization',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Events table
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
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  requires_response boolean DEFAULT false,
  is_repeating boolean DEFAULT false,
  repeat_pattern jsonb,
  parent_event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event responses table (for training attendance)
CREATE TABLE IF NOT EXISTS event_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  response text NOT NULL CHECK (response IN ('accepted', 'declined', 'pending')) DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Match results table
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  team_score integer NOT NULL DEFAULT 0,
  opponent_score integer NOT NULL DEFAULT 0,
  opponent_name text,
  match_outcome text GENERATED ALWAYS AS (
    CASE 
      WHEN team_score > opponent_score THEN 'win'
      WHEN team_score < opponent_score THEN 'loss'
      ELSE 'draw'
    END
  ) STORED,
  goals jsonb DEFAULT '[]'::jsonb,
  assists jsonb DEFAULT '[]'::jsonb,
  other_stats jsonb DEFAULT '{}'::jsonb,
  submitted_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

-- Team goals table
CREATE TABLE IF NOT EXISTS team_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline date NOT NULL,
  completed boolean DEFAULT false,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Goal tasks table
CREATE TABLE IF NOT EXISTS goal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES team_goals(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL CHECK (notification_type IN ('post_match', 'event_reminder', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  read_by jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
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

-- RLS Policies

-- Teams policies
CREATE POLICY "Users can view their own team"
  ON teams FOR SELECT
  TO authenticated
  USING (id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins and trainers can update their team"
  ON teams FOR UPDATE
  TO authenticated
  USING (id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ));

-- Users policies
CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Players policies
CREATE POLICY "Users can view team players"
  ON players FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Trainers and admins can manage players"
  ON players FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ));

-- Player stats policies
CREATE POLICY "Users can view team player stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (player_id IN (
    SELECT p.id FROM players p
    JOIN users u ON u.team_id = p.team_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "System can update player stats"
  ON player_stats FOR ALL
  TO authenticated
  USING (player_id IN (
    SELECT p.id FROM players p
    JOIN users u ON u.team_id = p.team_id
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'trainer')
  ));

-- Posts policies
CREATE POLICY "Users can view team posts"
  ON posts FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Trainers and admins can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Authors can update their posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their posts"
  ON posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Post reactions policies
CREATE POLICY "Users can view team post reactions"
  ON post_reactions FOR SELECT
  TO authenticated
  USING (post_id IN (
    SELECT p.id FROM posts p
    JOIN users u ON u.team_id = p.team_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Users can manage their own reactions"
  ON post_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Events policies
CREATE POLICY "Users can view team events"
  ON events FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Trainers and admins can manage events"
  ON events FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ));

-- Event responses policies
CREATE POLICY "Users can view team event responses"
  ON event_responses FOR SELECT
  TO authenticated
  USING (event_id IN (
    SELECT e.id FROM events e
    JOIN users u ON u.team_id = e.team_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Users can manage their own responses"
  ON event_responses FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Match results policies
CREATE POLICY "Users can view team match results"
  ON match_results FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Trainers and admins can manage match results"
  ON match_results FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ));

-- Team goals policies
CREATE POLICY "Users can view team goals"
  ON team_goals FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Trainers and admins can manage team goals"
  ON team_goals FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ));

-- Goal tasks policies
CREATE POLICY "Users can view team goal tasks"
  ON goal_tasks FOR SELECT
  TO authenticated
  USING (goal_id IN (
    SELECT g.id FROM team_goals g
    JOIN users u ON u.team_id = g.team_id
    WHERE u.id = auth.uid()
  ));

CREATE POLICY "Trainers and admins can manage goal tasks"
  ON goal_tasks FOR ALL
  TO authenticated
  USING (goal_id IN (
    SELECT g.id FROM team_goals g
    JOIN users u ON u.team_id = g.team_id
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'trainer')
  ));

-- Notifications policies
CREATE POLICY "Users can view team notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can manage notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT team_id FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'trainer')
  ));

-- Functions and Triggers

-- Function to update player stats when match results are added
CREATE OR REPLACE FUNCTION update_player_stats_from_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Update goals
  IF NEW.goals IS NOT NULL THEN
    UPDATE player_stats 
    SET goals = goals + (
      SELECT COUNT(*)::integer 
      FROM jsonb_array_elements(NEW.goals) AS goal
      WHERE (goal->>'playerId')::uuid = player_id
    ),
    matches_played = matches_played + 1,
    updated_at = now()
    WHERE player_id IN (
      SELECT DISTINCT (goal->>'playerId')::uuid
      FROM jsonb_array_elements(NEW.goals) AS goal
    );
  END IF;

  -- Update assists
  IF NEW.assists IS NOT NULL THEN
    UPDATE player_stats 
    SET assists = assists + (
      SELECT COUNT(*)::integer 
      FROM jsonb_array_elements(NEW.assists) AS assist
      WHERE (assist->>'playerId')::uuid = player_id
    ),
    updated_at = now()
    WHERE player_id IN (
      SELECT DISTINCT (assist->>'playerId')::uuid
      FROM jsonb_array_elements(NEW.assists) AS assist
    );
  END IF;

  -- Ensure all players in the match have their matches_played updated
  UPDATE player_stats 
  SET matches_played = matches_played + 1,
      updated_at = now()
  WHERE player_id IN (
    SELECT p.id FROM players p
    JOIN events e ON e.team_id = p.team_id
    WHERE e.id = NEW.event_id
  ) AND player_id NOT IN (
    SELECT DISTINCT (goal->>'playerId')::uuid
    FROM jsonb_array_elements(NEW.goals) AS goal
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating player stats
CREATE TRIGGER update_player_stats_trigger
  AFTER INSERT OR UPDATE ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();

-- Function to create player stats when a new player is added
CREATE OR REPLACE FUNCTION create_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO player_stats (player_id, season)
  VALUES (NEW.id, EXTRACT(YEAR FROM now())::text)
  ON CONFLICT (player_id, season) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for creating player stats
CREATE TRIGGER create_player_stats_trigger
  AFTER INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION create_player_stats();

-- Function to update team goal progress based on completed tasks
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_progress integer;
BEGIN
  -- Get task counts for the goal
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_tasks, completed_tasks
  FROM goal_tasks 
  WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);

  -- Calculate progress percentage
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::float / total_tasks::float) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update the team goal
  UPDATE team_goals 
  SET 
    progress = new_progress,
    completed = (new_progress = 100),
    updated_at = now()
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating goal progress
CREATE TRIGGER update_goal_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON goal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- Function to schedule post-match notifications
CREATE OR REPLACE FUNCTION schedule_post_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for matches
  IF NEW.event_type = 'match' AND NEW.end_time IS NOT NULL THEN
    INSERT INTO notifications (
      notification_type,
      title,
      message,
      event_id,
      team_id,
      scheduled_for
    ) VALUES (
      'post_match',
      'Match Results Needed',
      'Please enter the results for: ' || NEW.title,
      NEW.id,
      NEW.team_id,
      NEW.end_time + INTERVAL '3 hours'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scheduling post-match notifications
CREATE TRIGGER schedule_post_match_notification_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION schedule_post_match_notification();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_posts_team_id ON posts(team_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_team_id ON events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_match_results_team_id ON match_results(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_team_id ON notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);