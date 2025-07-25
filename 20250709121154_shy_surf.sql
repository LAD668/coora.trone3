/*
  # Fix User Profile Creation Policies

  1. Helper Functions
    - Create function to check user permissions safely
    
  2. Security Updates
    - Add policies to allow users to manage their own profile data
    - Enable self-registration while maintaining security
    - Allow users to create, read, update their own records

  3. Policy Management
    - Drop existing conflicting policies first
    - Create new policies with proper permissions
*/

-- Create helper function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = user_id;
$$;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Add policy to allow users to insert their own data (for profile creation)
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Add policy to allow users to update their own data  
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE TO authenticated
  USING (check_user_permission(id))
  WITH CHECK (check_user_permission(id));

-- Add policy to allow users to delete their own data
CREATE POLICY "Users can delete their own data" ON users
  FOR DELETE TO authenticated
  USING (check_user_permission(id));

-- Add policy to allow users to view their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO authenticated
  USING (check_user_permission(id));