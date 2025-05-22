/*
  # Configure admin access

  1. New Functions
    - `is_admin()` - Checks if the current user is an admin

  2. Security Updates
    - Add admin check function
    - Update RLS policies to use admin check
    - Add initial admin user

  3. Changes
    - Add admin email to configuration
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user's email matches the admin email
  RETURN (
    auth.jwt() ->> 'email' = 'fabricewilliam73@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing RLS policies to use the new is_admin() function
ALTER POLICY "Only admins can access api_keys" ON api_keys
USING (is_admin());

ALTER POLICY "Admins can read all facts" ON facts
USING (is_admin());

ALTER POLICY "Admins can insert facts" ON facts
WITH CHECK (is_admin());

ALTER POLICY "Admins can update facts" ON facts
USING (is_admin());