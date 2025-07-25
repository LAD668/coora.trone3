/*
  # Fix User Creation and Profile Management

  1. Security Updates
    - Add policies to allow users to insert their own profile data
    - Ensure authenticated users can create their initial profile

  2. User Management
    - Allow users to insert their own data during profile creation
    - Maintain security while enabling self-registration
*/

-- Add policy to allow users to insert their own data
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT TO public
  WITH CHECK (id = auth.uid());

-- Add policy to allow users to update their own data  
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE TO public
  USING (check_user_permission(id))
  WITH CHECK (check_user_permission(id));

-- Add policy to allow users to delete their own data
CREATE POLICY "Users can delete their own data" ON users
  FOR DELETE TO public
  USING (check_user_permission(id));

-- Add policy to allow users to view their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT TO public
  USING (check_user_permission(id));

-- Create helper function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = user_id;
$$;