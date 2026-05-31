-- Leo Club Website Database Schema
-- This file contains the SQL schema for the Supabase database
-- ============================================
-- Table: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Completed', 'Ongoing', 'Upcoming')),
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  project_date DATE,
  recruitment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
-- ============================================
-- Table: leadership
-- ============================================
CREATE TABLE IF NOT EXISTS leadership (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  -- Expanded to include all role types used by the application
  role_type TEXT NOT NULL CHECK (role_type IN ('Executive', 'Board', 'Chief', 'Advisor', 'PastPresident')),
  image_url TEXT NOT NULL,
  year TEXT NOT NULL,
  service_year TEXT,
  sort_order INTEGER DEFAULT 0,
  row_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for faster role_type filtering
CREATE INDEX IF NOT EXISTS idx_leadership_role_type ON leadership(role_type);
-- Create index for sort order queries
CREATE INDEX IF NOT EXISTS idx_leadership_sort_order ON leadership(sort_order);
-- ============================================
-- Table: site_content (key-value CMS store)
-- ============================================
CREATE TABLE IF NOT EXISTS site_content (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for faster section filtering
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_content_key ON site_content(key);
-- ============================================
-- Table: gallery
-- ============================================
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  show_on_home BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- Table: awards
-- ============================================
CREATE TABLE IF NOT EXISTS awards (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  year TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for sort order queries
CREATE INDEX IF NOT EXISTS idx_awards_sort_order ON awards(sort_order);
-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- Allow public read access to projects
CREATE POLICY "Allow public read access on projects" ON projects FOR
SELECT TO public USING (true);
-- Allow authenticated users to insert/update/delete projects
CREATE POLICY "Allow authenticated users to manage projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Enable RLS on leadership table
ALTER TABLE leadership ENABLE ROW LEVEL SECURITY;
-- Allow public read access to leadership
CREATE POLICY "Allow public read access on leadership" ON leadership FOR
SELECT TO public USING (true);
-- Allow authenticated users to insert/update/delete leadership
CREATE POLICY "Allow authenticated users to manage leadership" ON leadership FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Enable RLS on site_content table
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
-- Allow public read access to site_content
CREATE POLICY "Allow public read access on site_content" ON site_content FOR
SELECT TO public USING (true);
-- Allow authenticated users to manage site_content
CREATE POLICY "Allow authenticated users to manage site_content" ON site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Enable RLS on gallery table
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
-- Allow public read access to gallery
CREATE POLICY "Allow public read access on gallery" ON gallery FOR
SELECT TO public USING (true);
-- Allow authenticated users to manage gallery
CREATE POLICY "Allow authenticated users to manage gallery" ON gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Create indexes for gallery sort and filter
CREATE INDEX IF NOT EXISTS idx_gallery_sort_order ON gallery(sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_show_on_home ON gallery(show_on_home);
-- Enable RLS on awards table
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
-- Allow public read access to awards
CREATE POLICY "Allow public read access on awards" ON awards FOR
SELECT TO public USING (true);
-- Allow authenticated users to manage awards
CREATE POLICY "Allow authenticated users to manage awards" ON awards FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- Insert sample projects
INSERT INTO projects (
    title,
    category,
    description,
    image_url,
    project_date,
    recruitment_link
  )
VALUES (
    'Community Clean-Up Drive',
    'Completed',
    'A successful initiative to clean local parks and streets, engaging over 100 volunteers.',
    'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
    '2024-03-15',
    NULL
  ),
  (
    'Blood Donation Campaign',
    'Ongoing',
    'Ongoing campaign to collect blood donations for local hospitals. Join us every month!',
    'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800',
    NULL,
    NULL
  ),
  (
    'Youth Leadership Workshop',
    'Upcoming',
    'An upcoming workshop to develop leadership skills among university students.',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    '2025-02-20',
    'https://forms.google.com/example'
  ) ON CONFLICT DO NOTHING;
-- Insert sample leadership members
INSERT INTO leadership (name, position, role_type, image_url, year)
VALUES (
    'John Doe',
    'President',
    'Executive',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    '2024/2025'
  ),
  (
    'Jane Smith',
    'Vice President',
    'Executive',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    '2024/2025'
  ),
  (
    'Mike Johnson',
    'Secretary',
    'Executive',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    '2024/2025'
  ),
  (
    'Sarah Williams',
    'Treasurer',
    'Executive',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    '2024/2025'
  ),
  (
    'David Brown',
    'Board Member',
    'Board',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    '2024/2025'
  ),
  (
    'Emily Davis',
    'Board Member',
    'Board',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400',
    '2024/2025'
  ) ON CONFLICT DO NOTHING;
-- Insert default site content
INSERT INTO site_content (key, value, section)
VALUES ('hero_title', 'Leo Club of', 'hero'),
  (
    'hero_subtitle',
    'Sabaragamuwa University of Sri Lanka',
    'hero'
  ),
  ('hero_cta', 'Join Us', 'hero'),
  (
    'hero_tagline',
    'Empowering Youth, Serving Community',
    'hero'
  ),
  (
    'hero_bg_image',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1920&auto=format&fit=crop',
    'hero'
  ),
  (
    'about_mission',
    'To provide the youth of the world with an opportunity for development and contribution, individually and collectively, as responsible members of the local, national, and international community.',
    'about'
  ),
  (
    'about_vision',
    'To be the global leader in community and humanitarian service.',
    'about'
  ),
  (
    'about_history',
    'Founded in [Year], our club has been serving the community for over [X] years, dedicating countless hours to service projects that uplift our society.',
    'about'
  ),
  (
    'about_values',
    'Leadership, Experience, Opportunity. We believe in serving our community with integrity, passion, and a commitment to making the world a better place.',
    'about'
  ),
  (
    'contact_email',
    'leoclub@example.com',
    'contact'
  ),
  ('contact_phone', '+1 234 567 890', 'contact'),
  (
    'contact_address',
    '123 Leo Street, City Name',
    'contact'
  ),
  ('contact_facebook', '#', 'contact'),
  ('contact_instagram', '#', 'contact'),
  ('contact_whatsapp', '#', 'contact'),
  ('contact_linkedin', '#', 'contact'),
  (
    'footer_club_name',
    'Leo Club of [City Name]',
    'footer'
  ),
  (
    'footer_sponsor',
    'Sponsored by Lions Club of [City Name]',
    'footer'
  ) ON CONFLICT (key) DO NOTHING;
-- Insert sample gallery images
INSERT INTO gallery (image_url, caption, show_on_home, sort_order)
VALUES (
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600&auto=format&fit=crop',
    'Group photo',
    true,
    1
  ),
  (
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
    'Service project',
    true,
    2
  ),
  (
    'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600&auto=format&fit=crop',
    'Meeting',
    true,
    3
  ),
  (
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=600&auto=format&fit=crop',
    'Event',
    true,
    4
  ),
  (
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=600&auto=format&fit=crop',
    'Celebration',
    true,
    5
  ),
  (
    'https://images.unsplash.com/photo-1526657782461-9fe13402a841?q=80&w=600&auto=format&fit=crop',
    'Fundraiser',
    true,
    6
  ) ON CONFLICT DO NOTHING;
-- ============================================
-- Security Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS security_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_logs_email ON security_logs(email);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
-- Public can insert logs ONLY for valid event types (prevents log poisoning of brute-force counter)
-- Note: the best protection is Supabase Auth's built-in rate limiting; this is a secondary control
CREATE POLICY "Allow public insert on security_logs" ON security_logs FOR
INSERT TO public WITH CHECK (
  event_type IN ('login_failed', 'login_success', 'logout', 'account_locked', 'brute_force_detected')
);
-- Only authenticated users can read logs
CREATE POLICY "Allow authenticated read on security_logs" ON security_logs FOR
SELECT TO authenticated USING (true);
-- Only authenticated users can delete logs
CREATE POLICY "Allow authenticated delete on security_logs" ON security_logs FOR DELETE TO authenticated USING (true);
-- Seed: add alert_email to site_content
INSERT INTO site_content (key, value, section)
VALUES ('alert_email', '', 'security') ON CONFLICT (key) DO NOTHING;

-- Insert sample awards
INSERT INTO awards (title, description, image_url, year)
VALUES 
  ('Most Consistent Club', 'Awarded for maintaining high standards throughout the year.', 'https://images.unsplash.com/photo-1578574515323-c3c8ef01456d?w=400', '2023/2024'),
  ('Best Community Project', 'Recognized for the impact of our Blood Donation Campaign.', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=400', '2023/2024'),
  ('Outstanding Leadership', 'Special recognition for the club president.', 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400', '2022/2023')
ON CONFLICT DO NOTHING;

-- ============================================
-- Table: contact_messages
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on contact_messages table
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a contact message (insert)
CREATE POLICY "Allow public insert on contact_messages" ON contact_messages FOR
INSERT TO public WITH CHECK (true);

-- Only authenticated users (admins) can read contact messages
CREATE POLICY "Allow authenticated read on contact_messages" ON contact_messages FOR
SELECT TO authenticated USING (true);

-- Only authenticated users can delete contact messages
CREATE POLICY "Allow authenticated delete on contact_messages" ON contact_messages FOR DELETE TO authenticated USING (true);

-- Index for admin inbox ordering
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- ============================================
-- Table: content_logs (Admin audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS content_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  section TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by TEXT NOT NULL, -- email of the admin who performed the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_logs_created_at ON content_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_logs_section ON content_logs(section);

ALTER TABLE content_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can insert content logs
CREATE POLICY "Allow authenticated insert on content_logs" ON content_logs FOR
INSERT TO authenticated WITH CHECK (true);

-- Only authenticated admins can read content logs
CREATE POLICY "Allow authenticated read on content_logs" ON content_logs FOR
SELECT TO authenticated USING (true);

-- Only authenticated admins can delete content logs
CREATE POLICY "Allow authenticated delete on content_logs" ON content_logs FOR
DELETE TO authenticated USING (true);

-- ============================================
-- Table: magazines (E-Magazine feature)
-- ============================================
-- Enable moddatetime extension for auto-updating updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE IF NOT EXISTS magazines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  volume_number   INTEGER,
  issue_number    INTEGER,
  published_date  DATE,
  description     TEXT,
  cover_image_path TEXT,        -- Supabase Storage path (not public URL)
  pdf_file_path   TEXT NOT NULL, -- Supabase Storage path (not public URL)
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  is_downloadable BOOLEAN NOT NULL DEFAULT TRUE,
  tags            TEXT[],        -- PostgreSQL array
  view_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE TRIGGER magazines_updated_at
  BEFORE UPDATE ON magazines
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_magazines_is_published  ON magazines(is_published);
CREATE INDEX IF NOT EXISTS idx_magazines_published_date ON magazines(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_magazines_slug          ON magazines(slug);

-- ============================================
-- RLS for magazines table
-- ============================================
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;

-- Public can SELECT only published magazines
CREATE POLICY "Allow public read published magazines"
  ON magazines FOR SELECT
  TO public
  USING (is_published = TRUE);

-- Authenticated admins can INSERT, UPDATE, DELETE any magazine
CREATE POLICY "Allow authenticated users to manage magazines"
  ON magazines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RPC: increment_magazine_view
-- ============================================
-- Atomic increment for magazine view counts
CREATE OR REPLACE FUNCTION increment_magazine_view(magazine_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE magazines
  SET view_count = view_count + 1
  WHERE id = magazine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;