/*
  # Remove all mock data from database

  This migration removes all test/mock data from the database tables to start with a clean slate.
  
  1. Delete Operations
     - Remove all mock data from all tables in correct order (respecting foreign key constraints)
     - Clear all test users, clubs, teams, players, posts, events, etc.
  
  2. Reset Sequences
     - Reset any auto-increment sequences if needed
  
  Note: This will remove ALL data from the database. Use with caution in production.
*/

-- Delete data in correct order to respect foreign key constraints

-- Delete dependent data first
DELETE FROM post_reactions;
DELETE FROM event_responses;
DELETE FROM match_results;
DELETE FROM goal_tasks;
DELETE FROM team_goals;
DELETE FROM notifications;
DELETE FROM player_stats;
DELETE FROM posts;
DELETE FROM events;
DELETE FROM players;
DELETE FROM access_codes;

-- Delete main entities
DELETE FROM users;
DELETE FROM teams;
DELETE FROM clubs;

-- Note: This removes ALL data. In a real application, you might want to:
-- 1. Keep certain system/admin users
-- 2. Keep club structures but remove test data
-- 3. Use WHERE clauses to target specific test data only