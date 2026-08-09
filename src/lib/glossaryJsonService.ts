import { supabase } from './supabase';
import { getAuthDebugInfo, type AuthDebugInfo } from './authService';
import { slugify } from './slugify';
import glossaryData from '../data/glossary.json';
import glossarySeedPackage from '../data/glossary_seed_v1.json';

export interface GlossaryTermFromJson {
  id: string;
  term: string;
  definition: string;
  category: string;
  tags: string[];
  updatedAt: string;
  szint?: string;
  kapcsolodofogalmak?: string[];
  entry_type?: 'technical_concept' | 'industry_term';
  official_term_id?: string | null;
  official_term_name?: string | null;
  detailed_description?: string | null;
  practical_applications?: string | null;
  common_mistakes?: string | null;
  usage_example?: string | null;
  origin_note?: string | null;
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
}

export function getVideoUrls(term?: { video_urls?: string[] | null; video_url?: string | null } | null): string[] {
  if (!term) return [];
  const urls: string[] = [];
  if (Array.isArray(term.video_urls)) {
    for (const u of term.video_urls) {
      if (u && typeof u === 'string' && u.trim()) {
        const clean = u.trim();
        if (!urls.includes(clean)) urls.push(clean);
      }
    }
  }
  if (term.video_url && typeof term.video_url === 'string' && term.video_url.trim()) {
    const single = term.video_url.trim();
    if (!urls.includes(single)) {
      urls.push(single);
    }
  }
  return urls;
}

interface GlossaryTermSupabase {
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
  entry_type?: 'technical_concept' | 'industry_term';
  official_term_id?: string | null;
  official_term_name?: string | null;
  detailed_description?: string | null;
  practical_applications?: string | null;
  common_mistakes?: string | null;
  usage_example?: string | null;
  origin_note?: string | null;
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
  created_at: string;
  updated_at: string;
}

class GlossaryJsonService {
  private static instance: GlossaryJsonService;
  private terms: GlossaryTermFromJson[] = [];
  private fallbackTerms: GlossaryTermFromJson[] = [];

  private constructor() {
    const rawItems = (glossarySeedPackage.items && glossarySeedPackage.items.length > 0)
      ? glossarySeedPackage.items
      : glossaryData;

    this.fallbackTerms = (rawItems as unknown as GlossaryTermFromJson[]).map(t => ({
      ...t,
      updatedAt: t.updatedAt || new Date().toISOString(),
    }));
    this.terms = [...this.fallbackTerms];
  }

  static getInstance(): GlossaryJsonService {
    if (!GlossaryJsonService.instance) {
      GlossaryJsonService.instance = new GlossaryJsonService();
    }
    return GlossaryJsonService.instance;
  }

  async getAllTerms(): Promise<GlossaryTermFromJson[]> {
    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('term', { ascending: true });

      if (error) {
        console.error('Hiba a Supabase beolvasáskor:', error);
        return [...this.fallbackTerms];
      }

      if (!data || data.length === 0) {
        return [...this.fallbackTerms];
      }

      const terms: GlossaryTermFromJson[] = data.map((item: GlossaryTermSupabase) => ({
        id: item.id,
        term: item.term,
        definition: item.definition,
        category: item.category || '',
        tags: item.kulcsszavak || [],
        szint: item.szint || undefined,
        kapcsolodofogalmak: item.kapcsolodofogalmak || undefined,
        entry_type: item.entry_type || 'technical_concept',
        official_term_id: item.official_term_id,
        official_term_name: item.official_term_name,
        detailed_description: item.detailed_description,
        practical_applications: item.practical_applications,
        common_mistakes: item.common_mistakes,
        usage_example: item.usage_example,
        origin_note: item.origin_note,
        translations: item.translations,
        jargon_subtype: item.jargon_subtype,
        knowledge_graph_relations: item.knowledge_graph_relations,
        video_url: item.video_url,
        video_urls: item.video_urls,
        image_urls: item.image_urls,
        slides: item.slides,
        updatedAt: item.updated_at,
      }));

      // If Supabase does not have industry terms yet, merge in the seed dataset
      const hasIndustryTerms = terms.some((t) => t.entry_type === 'industry_term');
      if (!hasIndustryTerms && this.fallbackTerms.length > 0) {
        const mergedMap = new Map<string, GlossaryTermFromJson>();
        for (const t of terms) {
          mergedMap.set(t.id, t);
        }
        for (const fb of this.fallbackTerms) {
          if (!mergedMap.has(fb.id)) {
            mergedMap.set(fb.id, fb);
          }
        }
        const finalMerged = Array.from(mergedMap.values());
        this.terms = finalMerged;
        return finalMerged;
      }

      this.terms = terms;
      return terms;
    } catch (err) {
      console.error('Kivétel a glossary beolvasásakor:', err);
      return [...this.fallbackTerms];
    }
  }

  async addTerm(term: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>): Promise<GlossaryTermFromJson> {
    const authInfo = await getAuthDebugInfo();
    if (!authInfo.isAuthenticated || !authInfo.hasAdminRole) {
      throw new Error(`Nincs admin jogosultság. ${authInfo.error || 'Jelentkezz be admin felhasználóval.'}`);
    }

    const s = slugify(term.term);
    if (!s) {
      throw new Error(`Érvénytelen fogalomnév, nem állítható elő slug: "${term.term}"`);
    }

    const letter = term.term.charAt(0).toUpperCase();

    const supabaseTerm = {
      term: term.term,
      slug: s,
      definition: term.definition,
      letter,
      category: term.category,
      szint: term.szint || null,
      kulcsszavak: term.tags || [],
      kapcsolodofogalmak: term.kapcsolodofogalmak || [],
    };

    const { data, error } = await supabase
      .from('glossary_terms')
      .insert([supabaseTerm])
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase insert hiba: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nincs visszaadott adat az insert után');
    }

    const newTerm: GlossaryTermFromJson = {
      id: data.id,
      term: data.term,
      definition: data.definition,
      category: data.category,
      tags: data.kulcsszavak || [],
      szint: data.szint || undefined,
      kapcsolodofogalmak: data.kapcsolodofogalmak || undefined,
      updatedAt: data.updated_at,
    };

    this.terms.push(newTerm);
    return newTerm;
  }

  async addTermsFromImport(
    terms: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>[],
    externalIds?: string[]
  ): Promise<{ success: number; failed: number; errors: string[]; authDebug: AuthDebugInfo; firstSlug?: string }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;
    let firstSlug: string | undefined;

    // Auth ellenőrzés
    const authInfo = await getAuthDebugInfo();
    console.log('=== Auth Debug Info ===');
    console.log('Session:', authInfo.isAuthenticated ? 'VAN' : 'NINCS');
    console.log('User ID:', authInfo.userId || '(nincs)');
    console.log('Email:', authInfo.userEmail || '(nincs)');
    console.log('Role:', authInfo.hasAdminRole ? 'admin/editor' : 'nincs admin role');
    if (authInfo.error) {
      console.warn('Auth figyelmeztetés:', authInfo.error);
    }
    console.log('========================\n');

    if (!authInfo.isAuthenticated || !authInfo.hasAdminRole) {
      const msg = `Import megtagadva: nincs érvényes admin session. ${authInfo.error || ''}`;
      console.error(msg);
      return {
        success: 0,
        failed: terms.length,
        errors: [msg],
        authDebug: authInfo,
      };
    }

    for (let i = 0; i < terms.length; i++) {
      try {
        const term = terms[i];
        const s = slugify(term.term);

        if (!s) {
          failed++;
          const errMsg = `Sor ${i + 1} ("${term.term}"): slugify eredménye üres, kihagyva`;
          errors.push(errMsg);
          console.error(errMsg);
          continue;
        }

        if (i === 0) {
          firstSlug = s;
        }

        const letter = term.term.charAt(0).toUpperCase();
        const externalId = externalIds?.[i] || undefined;

        const supabaseTerm = {
          term: term.term,
          slug: s,
          definition: term.definition,
          letter,
          category: term.category,
          szint: term.szint || null,
          kulcsszavak: term.tags || [],
          kapcsolodofogalmak: term.kapcsolodofogalmak || [],
          external_id: externalId || null,
        };

        console.log(`Import: Sor ${i + 1}, term: "${term.term}", slug: "${s}"`);

        const { data, error } = await supabase
          .from('glossary_terms')
          .upsert([supabaseTerm], { onConflict: 'slug' })
          .select()
          .maybeSingle();

        if (error) {
          failed++;
          const errMsg = `Sor ${i + 1} ("${term.term}"): ${error.message}`;
          errors.push(errMsg);
          console.error('Upsert hiba:', errMsg);
          continue;
        }

        if (data) {
          const newTerm: GlossaryTermFromJson = {
            id: data.id,
            term: data.term,
            definition: data.definition,
            category: data.category,
            tags: data.kulcsszavak || [],
            szint: data.szint || undefined,
            kapcsolodofogalmak: data.kapcsolodofogalmak || undefined,
            updatedAt: data.updated_at,
          };

          const existingIndex = this.terms.findIndex(t => t.id === newTerm.id);
          if (existingIndex >= 0) {
            this.terms[existingIndex] = newTerm;
          } else {
            this.terms.push(newTerm);
          }
          success++;
        }
      } catch (err) {
        failed++;
        const errMsg = `Sor ${i + 1}: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`;
        errors.push(errMsg);
        console.error('Exception az import során:', errMsg);
      }
    }

    console.log(`\n=== Import Eredmény ===`);
    console.log(`Sikeres: ${success}, Sikertelen: ${failed}`);
    console.log(`Első slug minta: ${firstSlug || '(nincs)'}`);
    if (errors.length > 0) {
      console.log('Hibák:');
      errors.forEach(e => console.log(`  - ${e}`));
    }
    console.log('========================\n');

    return { success, failed, errors, authDebug: authInfo, firstSlug };
  }

  async deleteTerm(id: string): Promise<boolean> {
    const authInfo = await getAuthDebugInfo();
    if (!authInfo.isAuthenticated || !authInfo.hasAdminRole) {
      console.error('Törlés megtagadva: nincs admin jogosultság');
      return false;
    }

    try {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete hiba:', error);
        return false;
      }

      const index = this.terms.findIndex(t => t.id === id);
      if (index >= 0) {
        this.terms.splice(index, 1);
      }
      return true;
    } catch (err) {
      console.error('Hiba a fogalom törléskor:', err);
      return false;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('category')
        .neq('category', null);

      if (error || !data) {
        return [...new Set(this.fallbackTerms.map(t => t.category))].sort();
      }

      const categories = [...new Set(data.map((item: { category: string | null }) => item.category).filter((c): c is string => Boolean(c)))];
      return categories.sort();
    } catch (err) {
      console.error('Hiba a kategóriák beolvasásakor:', err);
      return [...new Set(this.fallbackTerms.map(t => t.category))].sort();
    }
  }
}

export const glossaryJsonService = GlossaryJsonService.getInstance();
