/*
  # Create facts table

  1. New Tables
    - `facts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `source` (text)
      - `category` (text)
      - `wtf_score` (numeric)
      - `contested_theory` (text)
      - `image_url` (text)
      - `video_url` (text)
      - `status` (text) - pending/approved/rejected
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `facts` table
    - Add policies for reading and writing facts
*/

CREATE TABLE IF NOT EXISTS facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  category text NOT NULL,
  wtf_score numeric NOT NULL CHECK (wtf_score >= 1 AND wtf_score <= 10),
  contested_theory text,
  image_url text,
  video_url text,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE facts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approved facts
CREATE POLICY "Anyone can read approved facts"
  ON facts
  FOR SELECT
  USING (status = 'approved');

-- Allow admins to read all facts
CREATE POLICY "Admins can read all facts"
  ON facts
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true');

-- Allow admins to insert facts
CREATE POLICY "Admins can insert facts"
  ON facts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

-- Allow admins to update facts
CREATE POLICY "Admins can update facts"
  ON facts
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'is_admin' = 'true');

-- Function to automatically update updated_at timestamp
CREATE TRIGGER update_facts_updated_at
  BEFORE UPDATE ON facts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();