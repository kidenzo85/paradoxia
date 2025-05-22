/*
  # Create advertising management tables

  1. New Tables
    - `ad_spaces`
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the ad space
      - `location` (text) - Where the ad appears (e.g., 'home_sidebar', 'detail_page_bottom')
      - `type` (text) - Type of ad ('adsense', 'affiliate', 'custom')
      - `status` (text) - Active status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ad_contents`
      - `id` (uuid, primary key)
      - `space_id` (uuid) - Reference to ad_spaces
      - `title` (text) - Ad title/name
      - `content` (text) - Ad content (HTML, script, or affiliate link)
      - `start_date` (timestamp) - When to start showing
      - `end_date` (timestamp) - When to stop showing
      - `priority` (integer) - Display priority
      - `status` (text) - Active status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
*/

-- Create ad_spaces table
CREATE TABLE IF NOT EXISTS ad_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  type text NOT NULL CHECK (type IN ('adsense', 'affiliate', 'custom')),
  status text NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'inactive',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ad_contents table
CREATE TABLE IF NOT EXISTS ad_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES ad_spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'scheduled')) DEFAULT 'inactive',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_contents ENABLE ROW LEVEL SECURITY;

-- Policies for ad_spaces
CREATE POLICY "Anyone can read active ad spaces"
  ON ad_spaces
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage ad spaces"
  ON ad_spaces
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Policies for ad_contents
CREATE POLICY "Anyone can read active ad contents"
  ON ad_contents
  FOR SELECT
  USING (
    status = 'active' 
    AND start_date <= now() 
    AND (end_date IS NULL OR end_date > now())
  );

CREATE POLICY "Admins can manage ad contents"
  ON ad_contents
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Update triggers
CREATE TRIGGER update_ad_spaces_updated_at
  BEFORE UPDATE ON ad_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_contents_updated_at
  BEFORE UPDATE ON ad_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();