/*
  # Create API keys table

  1. New Tables
    - `api_keys`
      - `id` (text, primary key) - API identifier
      - `key` (text) - Encrypted API key
      - `status` (text) - Connection status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for admin users only
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id text PRIMARY KEY,
  key text NOT NULL,
  status text CHECK (status IN ('connected', 'disconnected', 'unset')) DEFAULT 'unset',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access api_keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function before each update
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();