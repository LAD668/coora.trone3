/*
  # Add Access Codes System

  1. New Tables
    - `access_codes` - Store valid access codes for registration
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `description` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, optional)

  2. Security
    - Enable RLS on access_codes table
    - Add policies for access code management

  3. Initial Data
    - Insert some default access codes
*/

-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_codes
CREATE POLICY "Anyone can view active access codes" ON access_codes
  FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage access codes" ON access_codes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Insert default access codes
INSERT INTO access_codes (code, description, is_active) VALUES
  ('TEAM2024', 'General team access code for 2024', true),
  ('CLUB2024', 'Club member access code for 2024', true),
  ('PLAYER2024', 'Player registration code for 2024', true)
ON CONFLICT (code) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active, expires_at);