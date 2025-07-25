/*
  # Create Test Data for Development

  1. Test Environment Setup
    - Creates a test club with proper branding
    - Creates a test team under the club
    - Creates test users for all roles (admin, trainer, player, parent)
    - Creates sample players with realistic data
    - Creates test access codes for easy signup
    - Creates sample posts, events, and team goals

  2. Test Users Created
    - admin@test.com (Admin role)
    - trainer@test.com (Trainer role) 
    - player@test.com (Player role)
    - parent@test.com (Parent role)

  3. Test Access Codes
    - TEST2024, DEMO2024, DEV2024

  4. Sample Data
    - Welcome posts and training updates
    - Upcoming training event
    - Team improvement goal with tasks
*/

-- Generate consistent UUIDs for test data
DO $$
DECLARE
    test_club_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    test_team_id uuid := 'b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22';
    test_admin_id uuid := 'c2ggde99-9c0b-4ef8-bb6d-6bb9bd380a33';
    test_trainer_id uuid := 'd3hhef99-9c0b-4ef8-bb6d-6bb9bd380a44';
    test_player_id uuid := 'e4iifg99-9c0b-4ef8-bb6d-6bb9bd380a55';
    test_parent_id uuid := 'f5jjgh99-9c0b-4ef8-bb6d-6bb9bd380a66';
    test_player_1_id uuid := 'a6kkhi99-9c0b-4ef8-bb6d-6bb9bd380a77';
    test_player_2_id uuid := 'b7llij99-9c0b-4ef8-bb6d-6bb9bd380a88';
    test_player_3_id uuid := 'c8mmjk99-9c0b-4ef8-bb6d-6bb9bd380a99';
    test_player_4_id uuid := 'd9nnkl99-9c0b-4ef8-bb6d-6bb9bd380aaa';
    test_post_1_id uuid := 'e0oolm99-9c0b-4ef8-bb6d-6bb9bd380bbb';
    test_post_2_id uuid := 'f1ppmn99-9c0b-4ef8-bb6d-6bb9bd380ccc';
    test_event_id uuid := 'a2qqno99-9c0b-4ef8-bb6d-6bb9bd380ddd';
    test_goal_id uuid := 'b3rrop99-9c0b-4ef8-bb6d-6bb9bd380eee';
BEGIN
    -- Create test club
    INSERT INTO clubs (id, name, description, logo_url) VALUES 
    (
        test_club_id,
        'Test Sports Club',
        'A test club for development and testing purposes',
        'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create test team
    INSERT INTO teams (id, name, sport, color, club_id) VALUES 
    (
        test_team_id,
        'Test Team',
        'Football',
        '#1A73E8',
        test_club_id
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
        test_admin_id,
        'admin@test.com',
        'Test Administrator',
        'admin',
        test_club_id,
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
        test_trainer_id,
        'trainer@test.com',
        'Test Trainer',
        'trainer',
        test_club_id,
        test_team_id,
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
        test_player_id,
        'player@test.com',
        'Test Player',
        'player',
        test_club_id,
        test_team_id,
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
        test_parent_id,
        'parent@test.com',
        'Test Parent',
        'parent',
        test_club_id,
        test_team_id,
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
        test_player_1_id,
        'John Smith',
        'Forward',
        test_team_id,
        10,
        '2000-05-15'
    ),
    (
        test_player_2_id,
        'Mike Johnson',
        'Midfielder',
        test_team_id,
        8,
        '1999-08-22'
    ),
    (
        test_player_3_id,
        'David Wilson',
        'Defender',
        test_team_id,
        5,
        '2001-03-10'
    ),
    (
        test_player_4_id,
        'Alex Brown',
        'Goalkeeper',
        test_team_id,
        1,
        '2000-11-30'
    ) ON CONFLICT (id) DO NOTHING;

    -- Create test access codes for easy signup testing
    INSERT INTO access_codes (code, description, is_active, club_id) VALUES 
    ('TEST2024', 'Test access code for development', true, test_club_id),
    ('DEMO2024', 'Demo access code for testing', true, test_club_id),
    ('DEV2024', 'Development access code', true, test_club_id)
    ON CONFLICT (code) DO UPDATE SET
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        club_id = EXCLUDED.club_id;

    -- Create some test posts
    INSERT INTO posts (id, title, content, author_id, team_id, post_type) VALUES 
    (
        test_post_1_id,
        'Welcome to the Test Team!',
        'This is a test post to demonstrate the Info Hub functionality. You can see how posts appear and interact with them.',
        test_admin_id,
        test_team_id,
        'organization'
    ),
    (
        test_post_2_id,
        'Training Schedule Update',
        'Our training sessions will now be held every Tuesday and Thursday at 6 PM. Please make sure to arrive 15 minutes early for warm-up.',
        test_trainer_id,
        test_team_id,
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
        test_event_id,
        'Weekly Training Session',
        'training',
        (CURRENT_DATE + INTERVAL '2 days')::timestamptz,
        (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '18 hours')::timestamptz,
        (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '20 hours')::timestamptz,
        'Main Training Ground',
        'Bring your training gear and water bottle. Focus will be on passing drills and tactical positioning.',
        test_team_id,
        test_trainer_id,
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
        test_goal_id,
        'Improve Team Passing Accuracy',
        'Work on improving our passing accuracy to 85% or higher during matches. This will help us maintain better possession and create more scoring opportunities.',
        'high',
        65,
        (CURRENT_DATE + INTERVAL '30 days')::date,
        test_team_id,
        test_trainer_id
    ) ON CONFLICT (id) DO NOTHING;

    -- Create test goal tasks
    INSERT INTO goal_tasks (goal_id, title, completed, assigned_to) VALUES 
    (test_goal_id, 'Practice short passing drills', false, test_trainer_id),
    (test_goal_id, 'Analyze passing statistics from last match', true, test_trainer_id),
    (test_goal_id, 'Set up passing accuracy tracking system', false, test_trainer_id)
    ON CONFLICT DO NOTHING;

END $$;