/*
# Additive Migration: Centralized Advertising & Campaign System (ad_campaigns)

## Purpose
Adds advertisement campaigns, sponsor highlights, ad slot assignments (top_banner, sidebar, in_feed),
and impression/click tracking.
*/

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_name      text NOT NULL,
  placement_slot    text NOT NULL, -- 'top_banner' | 'sidebar' | 'in_feed'
  title             text NOT NULL,
  target_url        text,
  banner_image_url  text,
  status            text NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'scheduled' | 'ended'
  start_date        timestamptz NOT NULL DEFAULT now(),
  end_date          timestamptz,
  impressions_count integer NOT NULL DEFAULT 0,
  clicks_count      integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Public read for active campaigns
DROP POLICY IF EXISTS "Public read ad_campaigns" ON ad_campaigns;
CREATE POLICY "Public read ad_campaigns" ON ad_campaigns FOR SELECT TO anon, authenticated USING (true);

-- Insert Default Sample Campaigns
INSERT INTO ad_campaigns (sponsor_name, placement_slot, title, target_url, status, impressions_count, clicks_count)
VALUES
  ('Leier Hungária', 'top_banner', 'Prémium Leier Klímatégla Tavaszi Kampány', 'https://www.leier.hu', 'active', 1240, 86),
  ('Cemex Magyarország', 'sidebar', 'Cemex Transzportbeton Szakmai Ajánlat', 'https://www.cemex.hu', 'active', 850, 42),
  ('Bosch Professional', 'in_feed', 'Bosch Akkus Szerszámgépek Ipari Felhasználóknak', 'https://www.bosch.hu', 'active', 620, 29)
ON CONFLICT DO NOTHING;
