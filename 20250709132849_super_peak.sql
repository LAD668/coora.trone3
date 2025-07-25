/*
  # Create Test Users for Development

  1. Test Users
    - Creates test users for each role (admin, trainer, player, parent)
    - Sets up proper club and team associations
    - Provides realistic test data

  2. Test Club and Team
    - Creates a test club "Test Sports Club"
    - Creates a test team "Test Team" under the club
    - Links users to appropriate club/team

  3. Test Access Codes
    - Creates additional test access codes for easy signup testing
*/

-- Create test club
INSERT INTO clubs (id, name, description, logo_url) VALUES 
(
  'test-club-id-123',
  'Test Sports Club',
  'A test club for development and testing purposes',
  'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400'
) ON CONFLICT (id) DO NOTHING;

-- Create test team
INSERT INTO teams (id, name, sport, color, club_id) VALUES 
(
  'test-team-id-123',
  'Test Team',
  'Football',
  '#1A73E8',
  'test-club-id-123'
) ON CONFLICT (id) DO NOTHING;

-- Create test users (these will be created when they first sign in via Supabase Auth)
-- We'll create the user profiles that will be linked when they authenticate

-- Test Admin User
INSERT INTO users (
  id, 
  email, 
  name, 
  role, 
  club_id, 
  team_id,
  first_name,
  last_name
) VALUES (
  'test-admin-user-123',
  'admin@test.com',
  'Test Administrator',
  'admin',
  'test-club-id-123',
  NULL, -- Admins don't need a specific team
  'Test',
  'Administrator'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  club_id = EXCLUDED.club_id,
  team_id = EXCLUDED.team_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Test Trainer User
INSERT INTO users (
  id, 
  email, 
  name, 
  role, 
  club_id, 
  team_id,
  first_name,
  last_name
) VALUES (
  'test-trainer-user-123',
  'trainer@test.com',
  'Test Trainer',
  'trainer',
  'test-club-id-123',
  'test-team-id-123',
  'Test',
  'Trainer'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  club_id = EXCLUDED.club_id,
  team_id = EXCLUDED.team_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Test Player User
INSERT INTO users (
  id, 
  email, 
  name, 
  role, 
  club_id, 
  team_id,
  first_name,
  last_name
) VALUES (
  'test-player-user-123',
  'player@test.com',
  'Test Player',
  'player',
  'test-club-id-123',
  'test-team-id-123',
  'Test',
  'Player'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  club_id = EXCLUDED.club_id,
  team_id = EXCLUDED.team_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Test Parent User
INSERT INTO users (
  id, 
  email, 
  name, 
  role, 
  club_id, 
  team_id,
  first_name,
  last_name
) VALUES (
  'test-parent-user-123',
  'parent@test.com',
  'Test Parent',
  'parent',
  'test-club-id-123',
  'test-team-id-123',
  'Test',
  'Parent'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  club_id = EXCLUDED.club_id,
  team_id = EXCLUDED.team_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Create test players for the team
INSERT INTO players (id, name, position, team_id, jersey_number, date_of_birth) VALUES 
(
  'test-player-1',
  'John Smith',
  'Forward',
  'test-team-id-123',
  10,
  '2000-05-15'
),
(
  'test-player-2',
  'Mike Johnson',
  'Midfielder',
  'test-team-id-123',
  8,
  '1999-08-22'
),
(
  'test-player-3',
  'David Wilson',
  'Defender',
  'test-team-id-123',
  5,
  '2001-03-10'
),
(
  'test-player-4',
  'Alex Brown',
  'Goalkeeper',
  'test-team-id-123',
  1,
  '2000-11-30'
) ON CONFLICT (id) DO NOTHING;

-- Create test access codes for easy signup testing
INSERT INTO access_codes (code, description, is_active, club_id) VALUES 
('TEST2024', 'Test access code for development', true, 'test-club-id-123'),
('DEMO2024', 'Demo access code for testing', true, 'test-club-id-123'),
('DEV2024', 'Development access code', true, 'test-club-id-123')
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  club_id = EXCLUDED.club_id;

-- Create some test posts
INSERT INTO posts (id, title, content, author_id, team_id, post_type) VALUES 
(
  'test-post-1',
  'Welcome to the Test Team!',
  'This is a test post to demonstrate the Info Hub functionality. You can see how posts appear and interact with them.',
  'test-admin-user-123',
  'test-team-id-123',
  'organization'
),
(
  'test-post-2',
  'Training Schedule Update',
  'Our training sessions will now be held every Tuesday and Thursday at 6 PM. Please make sure to arrive 15 minutes early for warm-up.',
  'test-trainer-user-123',
  'test-team-id-123',
  'coach'
) ON CONFLICT (id) DO NOTHING;

-- Create a test event
INSERT INTO events (
  id,
  title,
  event_type,
  event_date,
  start_time,
  end_time,
  location,
  notes,
  team_id,
  created_by,
  requires_response
) VALUES (
  'test-event-1',
  'Weekly Training Session',
  'training',
  (CURRENT_DATE + INTERVAL '2 days')::timestamptz,
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '18 hours')::timestamptz,
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '20 hours')::timestamptz,
  'Main Training Ground',
  'Bring your training gear and water bottle. Focus will be on passing drills and tactical positioning.',
  'test-team-id-123',
  'test-trainer-user-123',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create a test team goal
INSERT INTO team_goals (
  id,
  title,
  description,
  priority,
  progress,
  deadline,
  team_id,
  created_by
) VALUES (
  'test-goal-1',
  'Improve Team Passing Accuracy',
  'Work on improving our passing accuracy to 85% or higher during matches. This will help us maintain better possession and create more scoring opportunities.',
  'high',
  65,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'test-team-id-123',
  'test-trainer-user-123'
) ON CONFLICT (id) DO NOTHING;

-- Create test goal tasks
INSERT INTO goal_tasks (goal_id, title, completed, assigned_to) VALUES 
('test-goal-1', 'Practice short passing drills', false, 'test-trainer-user-123'),
('test-goal-1', 'Analyze passing statistics from last match', true, 'test-trainer-user-123'),
('test-goal-1', 'Set up passing accuracy tracking system', false, 'test-trainer-user-123')
ON CONFLICT DO NOTHING;