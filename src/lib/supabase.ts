import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://olmavxcmkvvcebgqxohe.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbWF2eGNta3Z2Y2ViZ3F4b2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjAzNzksImV4cCI6MjA5NTgzNjM3OX0.uwz9kRkODHafloihBfDauFTAGk4dTb2X9TJrnF_vwHw';

if (typeof window !== 'undefined') {
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const fullUrl = hash + search;

    // Detect email verification callback and strip tokens to prevent automatic login
    if (fullUrl.includes('confirmed=true') || fullUrl.includes('type=signup') || fullUrl.includes('type=email_change')) {
      try {
        sessionStorage.setItem('email_confirmed_success', 'true');
      } catch {}

      // Clear any stored tokens from localStorage so no active session remains
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}

      // Clean hash URL before createClient parses access_token
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + '#login');
      } else {
        window.location.hash = '#login';
      }
    }
  } catch (e) {
    void e;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon_name: string | null;
          color: string | null;
          description: string | null;
          image_url: string | null;
          banner_url: string | null;
          image_fit: string | null;
          image_position: string | null;
          image_zoom: number | null;
          featured: boolean | null;
          sort_order: number | null;
          seo_title: string | null;
          seo_description: string | null;
          article_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon_name?: string | null;
          color?: string | null;
          description?: string | null;
          image_url?: string | null;
          banner_url?: string | null;
          image_fit?: string | null;
          image_position?: string | null;
          image_zoom?: number | null;
          featured?: boolean | null;
          sort_order?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          article_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon_name?: string | null;
          color?: string | null;
          description?: string | null;
          image_url?: string | null;
          banner_url?: string | null;
          image_fit?: string | null;
          image_position?: string | null;
          image_zoom?: number | null;
          featured?: boolean | null;
          sort_order?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          article_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          category_id: string | null;
          author: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          read_time: number;
          views: number;
          rating: number;
          rating_count: number;
          status: 'draft' | 'review' | 'published';
          featured_image: string | null;
          created_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          version?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string | null;
          category_id?: string | null;
          author?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          read_time?: number;
          views?: number;
          rating?: number;
          rating_count?: number;
          status?: 'draft' | 'review' | 'published';
          featured_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string | null;
          category_id?: string | null;
          author?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          read_time?: number;
          views?: number;
          rating?: number;
          rating_count?: number;
          status?: 'draft' | 'review' | 'published';
          featured_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      glossary_terms: {
        Row: {
          id: string;
          term: string;
          slug: string;
          definition: string;
          letter: string;
          category: string | null;
          szint: string | null;
          kulcsszavak: string[];
          kapcsolodofogalmak: string[];
          external_id: string | null;
          entry_type: 'technical_concept' | 'industry_term';
          official_term_id: string | null;
          official_term_name: string | null;
          detailed_description: string | null;
          practical_applications: string | null;
          common_mistakes: string | null;
          usage_example: string | null;
          origin_note: string | null;
          related_tool_ids: string[];
          related_article_ids: string[];
          translations: Record<string, string>;
          jargon_subtype: 'brand_name' | 'german_origin' | 'workplace_slang' | 'synonym' | null;
          knowledge_graph_relations: Array<{
            relation_type:
              | 'part_of'
              | 'contains'
              | 'made_from'
              | 'required_for'
              | 'prerequisite'
              | 'next_learning_step'
              | 'frequently_used_with'
              | 'common_mistake_of'
              | 'repaired_by'
              | 'safety_hazard_of'
              | 'standard_governed_by'
              | 'related_trade';
            target_term_id?: string;
            target_term_name: string;
            note?: string;
          }>;
          video_url: string | null;
          video_urls?: string[] | null;
          image_urls: string[];
          slides: Array<{ title: string; content: string; image_url?: string }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          term: string;
          slug: string;
          definition: string;
          letter: string;
          category?: string | null;
          szint?: string | null;
          kulcsszavak?: string[];
          kapcsolodofogalmak?: string[];
          external_id?: string | null;
          entry_type?: 'technical_concept' | 'industry_term';
          official_term_id?: string | null;
          official_term_name?: string | null;
          detailed_description?: string | null;
          practical_applications?: string | null;
          common_mistakes?: string | null;
          usage_example?: string | null;
          origin_note?: string | null;
          related_tool_ids?: string[];
          related_article_ids?: string[];
          translations?: Record<string, string>;
          jargon_subtype?: 'brand_name' | 'german_origin' | 'workplace_slang' | 'synonym' | null;
          knowledge_graph_relations?: Array<{
            relation_type:
              | 'part_of'
              | 'contains'
              | 'made_from'
              | 'required_for'
              | 'prerequisite'
              | 'next_learning_step'
              | 'frequently_used_with'
              | 'common_mistake_of'
              | 'repaired_by'
              | 'safety_hazard_of'
              | 'standard_governed_by'
              | 'related_trade';
            target_term_id?: string;
            target_term_name: string;
            note?: string;
          }>;
          video_url?: string | null;
          video_urls?: string[] | null;
          image_urls?: string[];
          slides?: Array<{ title: string; content: string; image_url?: string }>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          term?: string;
          slug?: string;
          definition?: string;
          letter?: string;
          category?: string | null;
          szint?: string | null;
          kulcsszavak?: string[];
          kapcsolodofogalmak?: string[];
          external_id?: string | null;
          entry_type?: 'technical_concept' | 'industry_term';
          official_term_id?: string | null;
          official_term_name?: string | null;
          detailed_description?: string | null;
          practical_applications?: string | null;
          common_mistakes?: string | null;
          usage_example?: string | null;
          origin_note?: string | null;
          related_tool_ids?: string[];
          related_article_ids?: string[];
          translations?: Record<string, string>;
          jargon_subtype?: 'brand_name' | 'german_origin' | 'workplace_slang' | 'synonym' | null;
          knowledge_graph_relations?: Array<{
            relation_type:
              | 'part_of'
              | 'contains'
              | 'made_from'
              | 'required_for'
              | 'prerequisite'
              | 'next_learning_step'
              | 'frequently_used_with'
              | 'common_mistake_of'
              | 'repaired_by'
              | 'safety_hazard_of'
              | 'standard_governed_by'
              | 'related_trade';
            target_term_id?: string;
            target_term_name: string;
            note?: string;
          }>;
          video_url?: string | null;
          video_urls?: string[] | null;
          image_urls?: string[];
          slides?: Array<{ title: string; content: string; image_url?: string }>;
          created_at?: string;
          updated_at?: string;
        };
      };
      tools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: string | null;
          brand: string | null;
          description: string | null;
          specs: Json;
          price: number | null;
          currency: string;
          features: string[];
          rating: number;
          rating_count: number;
          image_url: string | null;
          status: 'active' | 'discontinued';
          subtype: string | null;
          professions: string[];
          uses: string[];
          parts: Array<{ name: string; description: string }>;
          buying_guide: string[];
          common_mistakes: string[];
          technical_specs: Record<string, string>;
          video_url: string | null;
          recommended_products: Array<{ name: string; brand: string; partner_url: string; image_url?: string }>;
          seo_title: string | null;
          seo_description: string | null;
          keywords: string[];
          canonical_url: string | null;
          is_indexable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type?: string | null;
          brand?: string | null;
          description?: string | null;
          specs?: Json;
          price?: number | null;
          currency?: string;
          features?: string[];
          rating?: number;
          rating_count?: number;
          image_url?: string | null;
          status?: 'active' | 'discontinued';
          subtype?: string | null;
          professions?: string[];
          uses?: string[];
          parts?: Array<{ name: string; description: string }>;
          buying_guide?: string[];
          common_mistakes?: string[];
          technical_specs?: Record<string, string>;
          video_url?: string | null;
          recommended_products?: Array<{ name: string; brand: string; partner_url: string; image_url?: string }>;
          seo_title?: string | null;
          seo_description?: string | null;
          keywords?: string[];
          canonical_url?: string | null;
          is_indexable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          type?: string | null;
          brand?: string | null;
          description?: string | null;
          specs?: Json;
          price?: number | null;
          currency?: string;
          features?: string[];
          rating?: number;
          rating_count?: number;
          image_url?: string | null;
          status?: 'active' | 'discontinued';
          subtype?: string | null;
          professions?: string[];
          uses?: string[];
          parts?: Array<{ name: string; description: string }>;
          buying_guide?: string[];
          common_mistakes?: string[];
          technical_specs?: Record<string, string>;
          video_url?: string | null;
          recommended_products?: Array<{ name: string; brand: string; partner_url: string; image_url?: string }>;
          seo_title?: string | null;
          seo_description?: string | null;
          keywords?: string[];
          canonical_url?: string | null;
          is_indexable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: 'user' | 'editor' | 'admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          email_confirmed_at?: string | null;
          confirmed_at?: string | null;
          last_sign_in_at?: string | null;
          deleted_at?: string | null;
          is_deleted?: boolean | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: 'user' | 'editor' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          email_confirmed_at?: string | null;
          confirmed_at?: string | null;
          last_sign_in_at?: string | null;
          deleted_at?: string | null;
          is_deleted?: boolean | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: 'user' | 'editor' | 'admin';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          email_confirmed_at?: string | null;
          confirmed_at?: string | null;
          last_sign_in_at?: string | null;
          deleted_at?: string | null;
          is_deleted?: boolean | null;
        };
      };
      glossary_term_relations: {
        Row: {
          id: string;
          source_term_id: string;
          target_term_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_term_id: string;
          target_term_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_term_id?: string;
          target_term_id?: string;
          created_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          module: string;
          action: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          module: string;
          action: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          module?: string;
          action?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
      };
      partners: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: string;
          logo_url: string | null;
          website_url: string | null;
          description: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category: string;
          logo_url?: string | null;
          website_url?: string | null;
          description?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          category?: string;
          logo_url?: string | null;
          website_url?: string | null;
          description?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
      };
      partner_users: {
        Row: {
          partner_id: string;
          user_id: string;
          member_role: string;
          created_at: string;
        };
        Insert: {
          partner_id: string;
          user_id: string;
          member_role?: string;
          created_at?: string;
        };
        Update: {
          partner_id?: string;
          user_id?: string;
          member_role?: string;
          created_at?: string;
        };
      };
      contributors: {
        Row: {
          id: string;
          user_id: string;
          partner_id: string | null;
          trust_score: number;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          partner_id?: string | null;
          trust_score?: number;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          partner_id?: string | null;
          trust_score?: number;
          verified?: boolean;
          created_at?: string;
        };
      };
      ad_campaigns: {
        Row: {
          id: string;
          sponsor_name: string;
          placement_slot: string;
          title: string;
          target_url: string | null;
          banner_image_url: string | null;
          status: string;
          start_date: string;
          end_date: string | null;
          impressions_count: number;
          clicks_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sponsor_name: string;
          placement_slot: string;
          title: string;
          target_url?: string | null;
          banner_image_url?: string | null;
          status?: string;
          start_date?: string;
          end_date?: string | null;
          impressions_count?: number;
          clicks_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sponsor_name?: string;
          placement_slot?: string;
          title?: string;
          target_url?: string | null;
          banner_image_url?: string | null;
          status?: string;
          start_date?: string;
          end_date?: string | null;
          impressions_count?: number;
          clicks_count?: number;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          category: string;
          difficulty?: string | null;
          duration_hours: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          category: string;
          difficulty?: string;
          duration_hours?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          category?: string;
          difficulty?: string;
          duration_hours?: number;
          is_published?: boolean;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          sequence_order: number;
          content: string;
          video_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          sequence_order?: number;
          content: string;
          video_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          sequence_order?: number;
          content?: string;
          video_url?: string | null;
          created_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          pass_score_percentage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          pass_score_percentage?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          pass_score_percentage?: number;
          created_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options_json: string[];
          correct_option_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          options_json: string[];
          correct_option_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          options_json?: string[];
          correct_option_index?: number;
          created_at?: string;
        };
      };
      user_certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          score_achieved: number;
          certificate_code: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          score_achieved: number;
          certificate_code: string;
          issued_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          score_achieved?: number;
          certificate_code?: string;
          issued_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Article = Database['public']['Tables']['articles']['Row'];
export type GlossaryTerm = Database['public']['Tables']['glossary_terms']['Row'];
export type GlossaryTermRelation = Database['public']['Tables']['glossary_term_relations']['Row'];
export type Tool = Database['public']['Tables']['tools']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type Permission = Database['public']['Tables']['permissions']['Row'];
export type RolePermission = Database['public']['Tables']['role_permissions']['Row'];
export type Partner = Database['public']['Tables']['partners']['Row'];
export type PartnerUser = Database['public']['Tables']['partner_users']['Row'];
export type Contributor = Database['public']['Tables']['contributors']['Row'];
export type AdCampaign = Database['public']['Tables']['ad_campaigns']['Row'];

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export type CampaignStatusV2 =
  | 'draft'             // 🟡 Ajánlat készül
  | 'contracting'       // 🟠 Szerződés alatt
  | 'pending_payment'   // 🔵 Fizetésre vár
  | 'active'            // 🟢 Aktív
  | 'renewing'          // 🟣 Hosszabbítás alatt
  | 'expired'           // ⚫ Lejárt
  | 'cancelled';        // 🔴 Megszűnt

export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overdue';
export type ContractType = 'once' | 'monthly' | 'annual';
export type PackageTier = 'bronze' | 'silver' | 'gold' | 'custom';

export type BackgroundStyle = 'light_neutral' | 'dark_slate' | 'petrol_teal' | 'glassmorphism' | 'soft_gradient';
export type ButtonStyle = 'petrol_teal' | 'amber_gold' | 'dark_slate' | 'outline';
export type TextAlign = 'left' | 'center' | 'right';
export type AnimationType = 'none' | 'fade_in' | 'float' | 'marquee' | 'pulse';
export type TransitionEffect = 'fade' | 'slide_left' | 'slide_up' | 'zoom' | 'instant';

export interface AdCreative {
  id: string;
  campaign_id?: string | null;
  placement_key: 'top_banner' | 'in_feed' | 'sidebar' | 'footer_banner';
  partner_name: string;
  badge_text: string;
  headline: string;
  description: string;
  cta_text: string;
  cta_url: string;
  image_url?: string | null;
  mobile_image_url?: string | null;
  background_style: BackgroundStyle;
  overlay_style?: string | null;
  button_style: ButtonStyle;
  text_align: TextAlign;
  animation_type: AnimationType;
  transition_effect: TransitionEffect;
  rotation_seconds: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  sort_order: number;
  created_by?: string | null;
  updated_at: string;
}

export interface ExtendedAdCampaign extends AdCampaign {
  contact_person?: ContactPerson;
  package_tier?: PackageTier;
  contract_type?: ContractType;
  price_huf?: number;
  payment_status?: PaymentStatus;
  status_v2?: CampaignStatusV2;
  notes?: string;
  history_logs?: Array<{ timestamp: string; action: string; author: string }>;
}

export type ContractStatus =
  | 'draft'               // ⚪ Piszkozat
  | 'sent'                // 🔵 Kiküldve
  | 'viewed'              // 🟣 Megtekintve
  | 'pending_acceptance'  // 🟡 Elfogadásra vár
  | 'accepted'            // 🟢 Elfogadva
  | 'declined'            // 🔴 Elutasítva / Módosítást kér
  | 'expired';            // ⚫ Lejárt

export interface ContractAcceptanceLog {
  acceptedBy: string;
  email: string;
  acceptedAt: string;
  ipAddress: string;
  userId?: string;
  userAgent?: string;
}

export interface ContractVersion {
  versionNumber: number;
  createdAt: string;
  amount: number;
  content: string;
  changeNote?: string;
}

export interface AdvertisementContract {
  id: string;
  contractNumber: string; // e.g. ET-2026-00045
  campaignId: string;
  partnerId: string;
  partnerName: string;
  campaignTitle: string;
  placementSlot: string;
  templateId: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  amount: number;
  currency: 'HUF';
  content: string;
  versions: ContractVersion[];
  acceptanceLog?: ContractAcceptanceLog;
  createdAt: string;
  updatedAt: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  body: string;
  active: boolean;
}
export type Course = Database['public']['Tables']['courses']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type UserCertificate = Database['public']['Tables']['user_certificates']['Row'];

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content_type: string;
  content_id: string;
  comment_text: string;
  rating: number;
  created_at: string;
}

export interface UserFavorite {
  user_id: string;
  content_type: string;
  content_id: string;
  created_at: string;
}

export interface UserFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface JobPosting {
  id: string;
  partner_id?: string | null;
  company_name: string;
  title: string;
  job_type: 'full_time' | 'part_time' | 'apprenticeship';
  location: string;
  salary_range?: string | null;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id?: string | null;
  applicant_name: string;
  applicant_email: string;
  cover_note?: string | null;
  created_at: string;
}






