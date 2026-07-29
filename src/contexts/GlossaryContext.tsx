import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { glossaryJsonService, type GlossaryTermFromJson } from '../lib/glossaryJsonService';

interface GlossaryContextType {
  terms: GlossaryTermFromJson[];
  categories: string[];
  loading: boolean;
  addTerm: (term: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>) => Promise<void>;
  addTerms: (terms: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>[]) => Promise<void>;
  deleteTerm: (id: string) => Promise<void>;
  refreshTerms: () => Promise<void>;
}

const GlossaryContext = createContext<GlossaryContextType | undefined>(undefined);

interface GlossaryProviderProps {
  children: ReactNode;
}

export function GlossaryProvider({ children }: GlossaryProviderProps) {
  const [terms, setTerms] = useState<GlossaryTermFromJson[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialTerms();
  }, []);

  async function loadInitialTerms() {
    try {
      setLoading(true);
      const loadedTerms = await glossaryJsonService.getAllTerms();
      const loadedCategories = await glossaryJsonService.getCategories();
      setTerms(loadedTerms);
      setCategories(loadedCategories);
    } catch (err) {
      console.error('Hiba a glossary betöltésekor:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addTerm(termData: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>) {
    await glossaryJsonService.addTerm(termData);
    await refreshTerms();
  }

  async function addTerms(termsData: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>[]) {
    const importResult = await glossaryJsonService.addTermsFromImport(termsData);
    if (importResult.failed > 0) {
      throw new Error(
        `${importResult.success} fogalom importálva, ${importResult.failed} hiba. ${
          importResult.errors.length > 0 ? importResult.errors[0] : ''
        }`
      );
    }
    await refreshTerms();
  }

  async function deleteTerm(id: string) {
    await glossaryJsonService.deleteTerm(id);
    await refreshTerms();
  }

  async function refreshTerms() {
    try {
      const loadedTerms = await glossaryJsonService.getAllTerms();
      const loadedCategories = await glossaryJsonService.getCategories();
      setTerms(loadedTerms);
      setCategories(loadedCategories);
    } catch (err) {
      console.error('Hiba a glossary frissítésekor:', err);
    }
  }

  const value: GlossaryContextType = {
    terms,
    categories,
    loading,
    addTerm,
    addTerms,
    deleteTerm,
    refreshTerms,
  };

  return (
    <GlossaryContext.Provider value={value}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary() {
  const context = useContext(GlossaryContext);
  if (!context) {
    throw new Error('useGlossary must be used within GlossaryProvider');
  }
  return context;
}
