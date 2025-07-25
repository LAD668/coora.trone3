/*
  # Create Test Accounts for Development

  1. New Tables Data
    - Creates test club "Test Sports Club"
    - Creates test team "Test Team" 
    - Creates test user accounts for all roles (admin, trainer, player, parent)
    - Creates test players for the team
    - Creates test access codes for signup testing
    - Creates sample posts, events, and team goals

  2. Test Accounts Created
    - admin@test.com / password123 (Admin role)
    - trainer@test.com / password123 (Trainer role) 
    - player@test.com / password123 (Player role)
    - parent@test.com / password123 (Parent role)

  3. Access Codes
    - TEST2024, DEMO2024, DEV2024 for easy signup testing

  4. Sample Data
    - Posts in Info Hub
    - Training events
    - Team goals with tasks
    - Player roster
*/

-- Generate proper UUIDs using gen_random_uuid() function
DO $$
DECLARE
    test_club_id uuid := gen_random_uuid();
    test_team_id uuid := gen_random_uuid();
    test_admin_id uuid := gen_random_uuid();
    test_trainer_id uuid := gen_random_uuid();
    test_player_id uuid := gen_random_uuid();
    test_parent_id uuid := gen_random_uuid();
    test_player_1_id uuid := gen_random_uuid();
    test_player_2_id uuid := gen_random_uuid();
    test_player_3_id uuid := gen_random_uuid();
    test_player_4_id uuid := gen_random_uuid();
    test_post_1_id uuid := gen_random_uuid();
    test_post_2_id uuid := gen_random_uuid();
    test_event_id uuid := gen_random_uuid();
    test_goal_id uuid := gen_random_uuid();
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

    -- Create test users with fixed IDs for easier testing
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
        'test-admin-user-123'::uuid,
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
        'test-trainer-user-123'::uuid,
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
        'test-player-user-123'::uuid,
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
        'test-parent-user-123'::uuid,
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
        'test-admin-user-123'::uuid,
        test_team_id,
        'organization'
    ),
    (
        test_post_2_id,
        'Training Schedule Update',
        'Our training sessions will now be held every Tuesday and Thursday at 6 PM. Please make sure to arrive 15 minutes early for warm-up.',
        'test-trainer-user-123'::uuid,
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
        'test-trainer-user-123'::uuid,
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
        'test-trainer-user-123'::uuid
    ) ON CONFLICT (id) DO NOTHING;

    -- Create test goal tasks
    INSERT INTO goal_tasks (goal_id, title, completed, assigned_to) VALUES 
    (test_goal_id, 'Practice short passing drills', false, 'test-trainer-user-123'::uuid),
    (test_goal_id, 'Analyze passing statistics from last match', true, 'test-trainer-user-123'::uuid),
    (test_goal_id, 'Set up passing accuracy tracking system', false, 'test-trainer-user-123'::uuid)
    ON CONFLICT (goal_id, title) DO NOTHING;

    -- Log the created IDs for reference
    RAISE NOTICE 'Test data created successfully:';
    RAISE NOTICE 'Club ID: %', test_club_id;
    RAISE NOTICE 'Team ID: %', test_team_id;
    RAISE NOTICE 'Test accounts: admin@test.com, trainer@test.com, player@test.com, parent@test.com';
    RAISE NOTICE 'Password for all test accounts: password123';
    RAISE NOTICE 'Access codes: TEST2024, DEMO2024, DEV2024';

END $$;