-- HUI Phase 1 Migration
-- In Supabase Dashboard > SQL Editor ausführen

-- 1. Favorites Tabelle
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wirker_id UUID REFERENCES wirker(id) ON DELETE CASCADE,
  wirker_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- 2. Bookings Tabelle
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wirker_id UUID REFERENCES wirker(id) ON DELETE SET NULL,
  wirker_name TEXT NOT NULL,
  service TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  price_eur DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own bookings" ON bookings;
CREATE POLICY "Users can manage own bookings" ON bookings
  FOR ALL USING (auth.uid() = user_id);

-- 3. Profiles Tabelle erweitern
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_wirker BOOLEAN DEFAULT false;

-- 4. Wirker public lesbar machen
DROP POLICY IF EXISTS "Public read wirker" ON wirker;
CREATE POLICY "Public read wirker" ON wirker FOR SELECT USING (true);

-- 5. Impact Projects public lesbar
DROP POLICY IF EXISTS "Public read impact_projects" ON impact_projects;
CREATE POLICY "Public read impact_projects" ON impact_projects FOR SELECT USING (true);
