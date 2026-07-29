import { supabase, type GlossaryTerm } from '../lib/supabase';

export async function listGlossaryTerms(): Promise<GlossaryTerm[]> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('*')
    .order('term');
  if (error) throw error;
  return data || [];
}

export async function getGlossaryTerms(options?: {
  letter?: string;
  limit?: number;
}): Promise<GlossaryTerm[]> {
  let query = supabase.from('glossary_terms').select('*').order('term');

  if (options?.letter) {
    query = query.eq('letter', options.letter);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function searchGlossaryTerms(term: string): Promise<GlossaryTerm[]> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('*')
    .ilike('term', `%${term}%`)
    .order('term');
  if (error) throw error;
  return data || [];
}

export async function getGlossaryLetters(): Promise<string[]> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('letter')
    .order('letter');
  if (error) throw error;
  const letters = [...new Set(data?.map((item) => item.letter) || [])];
  return letters;
}

export async function createGlossaryTerm(payload: Record<string, unknown>): Promise<GlossaryTerm> {
  const res = await supabase.from('glossary_terms').insert(payload).select('*').single();
  if (res.error) throw res.error;
  return res.data as GlossaryTerm;
}

export async function updateGlossaryTerm(id: string, payload: Record<string, unknown>): Promise<GlossaryTerm> {
  const res = await supabase.from('glossary_terms').update(payload).eq('id', id).select('*').single();
  if (res.error) throw res.error;
  return res.data as GlossaryTerm;
}

export async function deleteGlossaryTerm(id: string): Promise<void> {
  const { error } = await supabase.from('glossary_terms').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertGlossaryTermBySlug(payload: Record<string, unknown>): Promise<GlossaryTerm | null> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .upsert([payload], { onConflict: 'slug' })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as GlossaryTerm | null;
}

export async function upsertGlossaryTermByExternalId(payload: Record<string, unknown>): Promise<GlossaryTerm | null> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .upsert([payload], { onConflict: 'external_id' })
    .select('id, external_id, term')
    .maybeSingle();
  if (error) throw error;
  return data as GlossaryTerm | null;
}

export async function countArticlesMentioningTerm(term: string): Promise<number> {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .or(`title.ilike.%${term}%,content.ilike.%${term}%`);
  if (error) throw error;
  return count ?? 0;
}

export async function countArticlesForTerms(terms: GlossaryTerm[]): Promise<Map<string, number>> {
  const entries = await Promise.all(
    terms.map((t) =>
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .or(`title.ilike.%${t.term}%,content.ilike.%${t.term}%`)
        .then(({ count, error }) => {
          if (error) throw error;
          return [t.id, count ?? 0] as const;
        })
    )
  );
  return new Map(entries);
}

export async function countGlossaryTerms(): Promise<number> {
  const { count, error } = await supabase
    .from('glossary_terms')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getGlossaryCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('category')
    .neq('category', null);
  if (error) throw error;
  const categories = [...new Set((data ?? []).map((item) => item.category).filter(Boolean))];
  return categories.sort();
}

export async function getTechnicalTerms(options?: {
  category?: string;
  level?: string;
  letter?: string;
}): Promise<GlossaryTerm[]> {
  let query = supabase
    .from('glossary_terms')
    .select('*')
    .or('entry_type.eq.technical_concept,entry_type.is.null')
    .order('term');

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }
  if (options?.level && options.level !== 'all') {
    query = query.eq('szint', options.level);
  }
  if (options?.letter) {
    query = query.eq('letter', options.letter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getIndustryTerms(): Promise<GlossaryTerm[]> {
  const { data, error } = await supabase
    .from('glossary_terms')
    .select('*')
    .eq('entry_type', 'industry_term')
    .order('term');
  if (error) throw error;
  return data || [];
}

export async function getOfficialTerm(jargonTermId: string): Promise<GlossaryTerm | null> {
  const { data: jargonData } = await supabase
    .from('glossary_terms')
    .select('official_term_id, official_term_name')
    .eq('id', jargonTermId)
    .maybeSingle();

  if (!jargonData?.official_term_id) return null;

  const { data: officialData } = await supabase
    .from('glossary_terms')
    .select('*')
    .eq('id', jargonData.official_term_id)
    .maybeSingle();

  return officialData;
}

export async function searchGlossary(queryStr: string): Promise<{
  technicalTerms: GlossaryTerm[];
  jargonTerms: GlossaryTerm[];
  linkedOfficialTerms: GlossaryTerm[];
}> {
  const clean = queryStr.trim().toLowerCase();
  if (!clean) {
    return { technicalTerms: [], jargonTerms: [], linkedOfficialTerms: [] };
  }

  const { data: allData, error } = await supabase
    .from('glossary_terms')
    .select('*')
    .or(`term.ilike.%${clean}%,definition.ilike.%${clean}%,kulcsszavak.cs.{${clean}}`)
    .order('term');

  if (error) throw error;
  const terms = allData || [];

  const jargonTerms = terms.filter((t) => t.entry_type === 'industry_term');
  const technicalTerms = terms.filter((t) => t.entry_type !== 'industry_term');

  const linkedIds = jargonTerms
    .map((j) => j.official_term_id)
    .filter((id): id is string => Boolean(id));

  let linkedOfficialTerms: GlossaryTerm[] = [];
  if (linkedIds.length > 0) {
    const { data: linked } = await supabase
      .from('glossary_terms')
      .select('*')
      .in('id', linkedIds);
    linkedOfficialTerms = linked || [];
  }

  return {
    technicalTerms,
    jargonTerms,
    linkedOfficialTerms,
  };
}

export async function replaceTermRelations(sourceTermId: string, relationRows: Record<string, unknown>[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('glossary_term_relations')
    .delete()
    .eq('source_term_id', sourceTermId);
  if (delErr) throw delErr;

  if (relationRows.length > 0) {
    const { error: insErr } = await supabase
      .from('glossary_term_relations')
      .insert(relationRows);
    if (insErr) throw insErr;
  }
}

export interface TradeEducationalStep {
  level: 'Kezdő' | 'Haladó' | 'Mester';
  title: string;
  category: string;
  description: string;
  termNames: string[];
}

export function getTradeEducationalPathways(trade: string): TradeEducationalStep[] {
  const normalized = trade.toLowerCase().trim();
  if (normalized.includes('kőműves') || normalized.includes('falazá') || normalized.includes('beton')) {
    return [
      {
        level: 'Kezdő',
        title: '1. Modul: Kötőanyagok & Anyagismeret',
        category: 'Anyagismeret',
        description: 'Mész, cement, homok és adalékszerek keverési alapjai.',
        termNames: ['Habarcs', 'Cement', 'Adalékanyag'],
      },
      {
        level: 'Haladó',
        title: '2. Modul: Falazástechnika & Szintezés',
        category: 'Falazás',
        description: 'Vázkerámia falazás, habarcsterítés és nyílásáthidalás.',
        termNames: ['Klímatégla', 'Vakolat', 'Pillér'],
      },
      {
        level: 'Mester',
        title: '3. Modul: Szerkezetépítés & Hőhídmentes csomópontok',
        category: 'Szerkezetépítés',
        description: 'Monolit koszorúk, vasbeton szerkezetek és hőhídmentes szigetelés.',
        termNames: ['Koszorú', 'Betonacél B500B', 'Lemezalap'],
      },
    ];
  }

  if (normalized.includes('ács') || normalized.includes('tető')) {
    return [
      {
        level: 'Kezdő',
        title: '1. Modul: Faanyagok & Nedvességtartalom',
        category: 'Anyagismeret',
        description: 'Fagerendák, lécprofilok és faanyagvédelem.',
        termNames: ['Léc / Fagerenda', 'Stafni', 'Párazáró fólia'],
      },
      {
        level: 'Haladó',
        title: '2. Modul: Fedélszékek & Szarufák',
        category: 'Szerkezetépítés',
        description: 'Szarufák szabása, tarajcserép léc és rögzítés.',
        termNames: ['Szarufa', 'Zsaluzat', 'Páraáteresztő fólia'],
      },
      {
        level: 'Mester',
        title: '3. Modul: Összetett Kontytetők & Bádogozás',
        category: 'Tetőfedés',
        description: 'Hajlatbádog, ereszcsatorna rögzítés és vízelvezetés.',
        termNames: ['Kerámiacserép', 'Hajlatbádog', 'Ereszcsatorna'],
      },
    ];
  }

  if (normalized.includes('burkoló') || normalized.includes('hidegburkoló')) {
    return [
      {
        level: 'Kezdő',
        title: '1. Modul: Aljzatkiegyenlítés & Alapozás',
        category: 'Hidegburkolás',
        description: 'Mélyalapozás, esztrich szintezés és mérés.',
        termNames: ['Aljzatkiegyenlítő', 'Esztrich', 'Mélyalapozó'],
      },
      {
        level: 'Haladó',
        title: '2. Modul: Csemperagasztás & Hajlatszigetelés',
        category: 'Hidegburkolás',
        description: 'Flexibilis C2TE ragasztó és kent vízszigetelés.',
        termNames: ['Flexibilis csemperagasztó', 'Kenhető vízszigetelés', 'Fugázó anyag'],
      },
      {
        level: 'Mester',
        title: '3. Modul: Nagyformátumú lapok & Epoxi gérvágás',
        category: 'Hidegburkolás',
        description: 'Gyémánttárcsás vágás, szintező klipszek és epoxi fugázás.',
        termNames: ['Gyémánttárcsás vágó', 'Szilikon tömítő'],
      },
    ];
  }

  // Default General Pathway
  return [
    {
      level: 'Kezdő',
      title: '1. Modul: Építőipari Alapfogalmak',
      category: 'Anyagismeret',
      description: 'Alapvető kötőanyagok, szerszámok és méréstechnika.',
      termNames: ['Habarcs', 'Beton', 'Sarokcsiszoló'],
    },
    {
      level: 'Haladó',
      title: '2. Modul: Kivitelezési Technológia',
      category: 'Szerkezetépítés',
      description: 'Szerkezetépítési lépések, munkavédelem és szabványok.',
      termNames: ['Betonacél B500B', 'Döngölőgép', 'Homlokzati hőszigetelő rendszer (THR)'],
    },
    {
      level: 'Mester',
      title: '3. Modul: Szerkezetépítés & Minőségellenőrzés',
      category: 'Alapozás & Földmunka',
      description: 'Hibaelhárítás, diagnosztika és mesterfokú kivitelezés.',
      termNames: ['Lemezalap', 'Koszorú', 'Duzzadó szalag'],
    },
  ];
}

