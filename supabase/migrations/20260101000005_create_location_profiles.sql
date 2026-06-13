-- Location profiles: optional, user-authored only
CREATE TABLE location_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id    UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT location_profiles_name_length CHECK (char_length(name) >= 1)
);

-- Index for CRUD per novel
CREATE INDEX idx_location_profiles_novel_id ON location_profiles (novel_id, sort_order);

-- Enable RLS
ALTER TABLE location_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read profiles for their novels
CREATE POLICY "location_profiles_select_own" ON location_profiles
  FOR SELECT TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Users can insert profiles for their novels
CREATE POLICY "location_profiles_insert_own" ON location_profiles
  FOR INSERT TO authenticated
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can update profiles for their novels
CREATE POLICY "location_profiles_update_own" ON location_profiles
  FOR UPDATE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()))
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can delete profiles for their novels
CREATE POLICY "location_profiles_delete_own" ON location_profiles
  FOR DELETE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON location_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
