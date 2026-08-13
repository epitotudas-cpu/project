import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PRIVACY_POLICY_DATA,
  TERMS_DATA,
  COOKIE_POLICY_DATA,
} from '../data/legalDocs';

export interface LegalSection {
  title: string;
  text: string;
  list?: string[];
}

export interface LegalDocItem {
  title: string;
  lastUpdated: string;
  version: string;
  sections: LegalSection[];
}

export interface LegalDocsData {
  privacyPolicy: LegalDocItem;
  terms: LegalDocItem;
  cookiePolicy: typeof COOKIE_POLICY_DATA;
}

export const DEFAULT_LEGAL_DOCS: LegalDocsData = {
  privacyPolicy: PRIVACY_POLICY_DATA,
  terms: TERMS_DATA,
  cookiePolicy: COOKIE_POLICY_DATA,
};

const STORAGE_KEY = 'epitotudas_legal_docs_v1';
const SUPABASE_LEGAL_ID = '00000000-0000-0000-0000-000000000005';

declare global {
  interface Window {
    __GLOBAL_LEGAL_DOCS__?: LegalDocsData;
  }
}

export function getLegalDocs(): LegalDocsData {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_LEGAL_DOCS__) {
      return window.__GLOBAL_LEGAL_DOCS__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const docs = {
        privacyPolicy: { ...DEFAULT_LEGAL_DOCS.privacyPolicy, ...(parsed.privacyPolicy || {}) },
        terms: { ...DEFAULT_LEGAL_DOCS.terms, ...(parsed.terms || {}) },
        cookiePolicy: { ...DEFAULT_LEGAL_DOCS.cookiePolicy, ...(parsed.cookiePolicy || {}) },
      };
      if (typeof window !== 'undefined') window.__GLOBAL_LEGAL_DOCS__ = docs;
      return docs;
    }
  } catch (err) {
    console.error('Hiba a jogi dokumentumok olvasásakor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_LEGAL_DOCS__ = DEFAULT_LEGAL_DOCS;
  return DEFAULT_LEGAL_DOCS;
}

export function saveLegalDocs(docs: LegalDocsData): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_LEGAL_DOCS__ = docs;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    window.dispatchEvent(new Event('legal-docs-changed'));

    // Cloud sync to Supabase categories system row
    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_LEGAL_ID,
          name: '__SYSTEM_CONFIG_LEGAL_DOCS__',
          slug: 'system-legal-docs-config',
          description: JSON.stringify(docs),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase legal docs cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a jogi dokumentumok mentésekor:', err);
  }
}

export async function fetchLegalDocsFromCloud(): Promise<LegalDocsData | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_LEGAL_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('{')) {
      const parsed = JSON.parse(data.description);
      const docs: LegalDocsData = {
        privacyPolicy: { ...DEFAULT_LEGAL_DOCS.privacyPolicy, ...(parsed.privacyPolicy || {}) },
        terms: { ...DEFAULT_LEGAL_DOCS.terms, ...(parsed.terms || {}) },
        cookiePolicy: { ...DEFAULT_LEGAL_DOCS.cookiePolicy, ...(parsed.cookiePolicy || {}) },
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_LEGAL_DOCS__ = docs;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
        window.dispatchEvent(new Event('legal-docs-changed'));
      }
      return docs;
    }
  } catch (err) {
    console.warn('Cloud legal docs fetch info:', err);
  }
  return null;
}

export function useLegalDocs(): LegalDocsData {
  const [docs, setDocs] = useState<LegalDocsData>(() => getLegalDocs());

  useEffect(() => {
    function handleChange() {
      setDocs(getLegalDocs());
    }
    handleChange();

    void fetchLegalDocsFromCloud().then((cloudDocs) => {
      if (cloudDocs) setDocs(cloudDocs);
    });

    window.addEventListener('legal-docs-changed', handleChange);
    return () => window.removeEventListener('legal-docs-changed', handleChange);
  }, []);

  return docs;
}
