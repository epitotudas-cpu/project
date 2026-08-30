-- ============================================================================
-- ÉpítőTudás - Supabase Database Schema Migration SQL Script
-- Execute this script in the Supabase SQL Editor if you wish to create
-- native database tables for ad_campaigns, partners, courses, comments, etc.
-- ============================================================================

-- 1. Create 'partners' table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'ad_campaigns' table
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_name TEXT NOT NULL,
    placement_slot TEXT NOT NULL,
    title TEXT NOT NULL,
    target_url TEXT,
    banner_image_url TEXT,
    status TEXT DEFAULT 'active',
    status_v2 TEXT DEFAULT 'active',
    package_tier TEXT DEFAULT 'silver',
    contract_type TEXT DEFAULT 'monthly',
    price_huf NUMERIC DEFAULT 99000,
    payment_status TEXT DEFAULT 'paid',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    impressions_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'ad_creatives' table
CREATE TABLE IF NOT EXISTS public.ad_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_key TEXT NOT NULL,
    partner_name TEXT NOT NULL,
    badge_text TEXT,
    headline TEXT NOT NULL,
    description TEXT,
    cta_text TEXT,
    cta_url TEXT,
    image_url TEXT,
    mobile_image_url TEXT,
    background_style TEXT DEFAULT 'light_neutral',
    overlay_style TEXT DEFAULT 'none',
    button_style TEXT DEFAULT 'petrol_teal',
    text_align TEXT DEFAULT 'left',
    animation_type TEXT DEFAULT 'pulse',
    transition_effect TEXT DEFAULT 'slide_left',
    rotation_seconds INT DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    sort_order INT DEFAULT 1,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'advertisers' table
CREATE TABLE IF NOT EXISTS public.advertisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    contact_role TEXT,
    category TEXT DEFAULT 'ceg',
    website_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create 'ad_placements' table
CREATE TABLE IF NOT EXISTS public.ad_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    desktop_dimensions TEXT,
    mobile_dimensions TEXT,
    max_file_size_kb INT DEFAULT 5000,
    allowed_formats TEXT[] DEFAULT ARRAY['PNG','WebP','SVG','GIF'],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create 'ad_payments' table
CREATE TABLE IF NOT EXISTS public.ad_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    campaign_title TEXT NOT NULL,
    advertiser_name TEXT NOT NULL,
    contract_id TEXT,
    amount_huf NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'HUF',
    due_date TIMESTAMPTZ DEFAULT NOW(),
    paid_date TIMESTAMPTZ,
    status TEXT DEFAULT 'unpaid',
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create 'ad_notifications' table
CREATE TABLE IF NOT EXISTS public.ad_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    target_module TEXT NOT NULL,
    target_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS) policies
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update partners" ON public.partners FOR ALL USING (true);

CREATE POLICY "Allow public read ad_campaigns" ON public.ad_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ad_campaigns" ON public.ad_campaigns FOR ALL USING (true);

CREATE POLICY "Allow public read ad_creatives" ON public.ad_creatives FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ad_creatives" ON public.ad_creatives FOR ALL USING (true);

CREATE POLICY "Allow public read advertisers" ON public.advertisers FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update advertisers" ON public.advertisers FOR ALL USING (true);

CREATE POLICY "Allow public read ad_placements" ON public.ad_placements FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ad_placements" ON public.ad_placements FOR ALL USING (true);

CREATE POLICY "Allow public read ad_payments" ON public.ad_payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ad_payments" ON public.ad_payments FOR ALL USING (true);

CREATE POLICY "Allow public read ad_notifications" ON public.ad_notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update ad_notifications" ON public.ad_notifications FOR ALL USING (true);
