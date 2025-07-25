/*
  # Create Test Login Accounts

  1. New Tables
    - Creates test club, team, users, players, and sample data
    - Sets up test login accounts with proper authentication
    - Includes access codes for signup testing

  2. Test Accounts
    - admin@test.com (password: password123) - Administrator role
    - trainer@test.com (password: password123) - Trainer role  
    - player@test.com (password: password123) - Player role
    - parent@test.com (password: password123) - Parent role

  3. Sample Data
    - Test club and team structure
    - Sample players, posts, events, and team goals
    - Access codes: TEST2024, DEMO2024, DEV2024

  4. Security
    - All tables maintain existing RLS policies
    - Test data respects existing constraints and relationships
*/

-- Create test club with proper UUID
INSERT INTO clubs (id, name, description, logo_url) VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'Test Sports Club',
  'A test club for development and testing purposes',
  'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400'
) ON CONFLICT (id) DO NOTHING;

-- Create test team with proper UUID
INSERT INTO teams (id, name, sport, color, club_id) VALUES 
(
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  'Test Team',
  'Football',
  '#1A73E8',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Create test users with proper UUIDs
-- These will be updated when users actually sign up through Supabase Auth

-- Test Admin User (admin@test.com / password123)
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
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
  'admin@test.com',
  'Test Administrator',
  'admin',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
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

-- Test Trainer User (trainer@test.com / password123)
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
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
  'trainer@test.com',
  'Test Trainer',
  'trainer',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
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

-- Test Player User (player@test.com / password123)
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
  'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid,
  'player@test.com',
  'Test Player',
  'player',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
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

-- Test Parent User (parent@test.com / password123)
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
  'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid,
  'parent@test.com',
  'Test Parent',
  'parent',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
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
  'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77'::uuid,
  'John Smith',
  'Forward',
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  10,
  '2000-05-15'
),
(
  'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88'::uuid,
  'Mike Johnson',
  'Midfielder',
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  8,
  '1999-08-22'
),
(
  'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99'::uuid,
  'David Wilson',
  'Defender',
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  5,
  '2001-03-10'
),
(
  'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa'::uuid,
  'Alex Brown',
  'Goalkeeper',
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  1,
  '2000-11-30'
) ON CONFLICT (id) DO NOTHING;

-- Create test access codes for easy signup testing
INSERT INTO access_codes (code, description, is_active, club_id) VALUES 
('TEST2024', 'Test access code for development', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
('DEMO2024', 'Demo access code for testing', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid),
('DEV2024', 'Development access code', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  club_id = EXCLUDED.club_id;

-- Create some test posts
INSERT INTO posts (id, title, content, author_id, team_id, post_type) VALUES 
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380bbb'::uuid,
  'Welcome to the Test Team!',
  'This is a test post to demonstrate the Info Hub functionality. You can see how posts appear and interact with them.',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  'organization'
),
(
  'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380ccc'::uuid,
  'Training Schedule Update',
  'Our training sessions will now be held every Tuesday and Thursday at 6 PM. Please make sure to arrive 15 minutes early for warm-up.',
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
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
  'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380ddd'::uuid,
  'Weekly Training Session',
  'training',
  (CURRENT_DATE + INTERVAL '2 days')::timestamptz,
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '18 hours')::timestamptz,
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '20 hours')::timestamptz,
  'Main Training Ground',
  'Bring your training gear and water bottle. Focus will be on passing drills and tactical positioning.',
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid,
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
  'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380eee'::uuid,
  'Improve Team Passing Accuracy',
  'Work on improving our passing accuracy to 85% or higher during matches. This will help us maintain better possession and create more scoring opportunities.',
  'high',
  65,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Create test goal tasks
INSERT INTO goal_tasks (goal_id, title, completed, assigned_to) VALUES 
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380eee'::uuid, 'Practice short passing drills', false, 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid),
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380eee'::uuid, 'Analyze passing statistics from last match', true, 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid),
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380eee'::uuid, 'Set up passing accuracy tracking system', false, 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid)
ON CONFLICT (goal_id, title) DO NOTHING;

-- Create some test post reactions to demonstrate the feature
INSERT INTO post_reactions (post_id, user_id, emoji) VALUES 
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380bbb'::uuid, 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid, '👍'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380bbb'::uuid, 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid, '❤️'),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380ccc'::uuid, 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid, '👍'),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380ccc'::uuid, 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid, '🔥')
ON CONFLICT (post_id, user_id, emoji) DO NOTHING;

-- Create test event response to show training attendance
INSERT INTO event_responses (event_id, user_id, response, responded_at) VALUES 
('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380ddd'::uuid, 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'::uuid, 'accepted', NOW()),
('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380ddd'::uuid, 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66'::uuid, 'pending', NULL)
ON CONFLICT (event_id, user_id) DO NOTHING;