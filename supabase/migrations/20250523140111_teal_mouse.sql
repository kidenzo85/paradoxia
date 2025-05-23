/*
  # Configuration de la génération automatique de faits

  1. New Tables
    - `auto_generation_config`
      - `id` (uuid, primary key)
      - `category` (text) - Catégorie de faits
      - `min_interval` (interval) - Intervalle minimum entre les générations
      - `max_interval` (interval) - Intervalle maximum entre les générations
      - `enabled` (boolean) - État d'activation
      - `auto_approve` (boolean) - Approbation automatique
      - `languages` (text[]) - Langues de traduction
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on table
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS auto_generation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  min_interval interval NOT NULL DEFAULT '1 hour',
  max_interval interval NOT NULL DEFAULT '24 hours',
  enabled boolean NOT NULL DEFAULT false,
  auto_approve boolean NOT NULL DEFAULT false,
  languages text[] NOT NULL DEFAULT ARRAY['fr', 'en', 'zh', 'ar', 'es'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE auto_generation_config ENABLE ROW LEVEL SECURITY;

-- Policies for auto_generation_config
CREATE POLICY "Admins can manage auto generation config"
  ON auto_generation_config
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Update trigger
CREATE TRIGGER update_auto_generation_config_updated_at
  BEFORE UPDATE ON auto_generation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();