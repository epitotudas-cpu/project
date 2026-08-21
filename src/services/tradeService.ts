import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TRADE_DETAILS, type TradeDetail } from '../data/tradeDetailsData';

export interface TradeItem extends TradeDetail {
  isActive: boolean;
  displayOrder: number;
}

export function buildDefaultTradeItems(): TradeItem[] {
  return Object.values(TRADE_DETAILS).map((trade, idx) => ({
    ...trade,
    isActive: true,
    displayOrder: idx + 1,
  }));
}

export const DEFAULT_TRADE_ITEMS: TradeItem[] = buildDefaultTradeItems();

const STORAGE_KEY = 'epitotudas_trades_data_v1';
const SUPABASE_TRADES_ID = '00000000-0000-0000-0000-000000000007';

declare global {
  interface Window {
    __GLOBAL_TRADES_DATA__?: TradeItem[];
  }
}

export function getTradeItems(): TradeItem[] {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_TRADES_DATA__) {
      return window.__GLOBAL_TRADES_DATA__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') window.__GLOBAL_TRADES_DATA__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a szakmák betöltésekor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_TRADES_DATA__ = DEFAULT_TRADE_ITEMS;
  return DEFAULT_TRADE_ITEMS;
}

export function saveTradeItems(items: TradeItem[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_TRADES_DATA__ = items;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('trades-data-changed'));

    // Cloud sync to Supabase categories system row
    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_TRADES_ID,
          name: '__SYSTEM_CONFIG_TRADES__',
          slug: 'system-trades-config',
          description: JSON.stringify(items),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase trades cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a szakmák mentésekor:', err);
  }
}

export async function fetchTradeItemsFromCloud(): Promise<TradeItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_TRADES_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('[')) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') {
          window.__GLOBAL_TRADES_DATA__ = parsed;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          window.dispatchEvent(new Event('trades-data-changed'));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Cloud trades fetch info:', err);
  }
  return null;
}

export function useTrades(): TradeItem[] {
  const [items, setItems] = useState<TradeItem[]>(() => getTradeItems());

  useEffect(() => {
    function handleChange() {
      setItems(getTradeItems());
    }
    handleChange();

    void fetchTradeItemsFromCloud().then((cloudItems) => {
      if (cloudItems) setItems(cloudItems);
    });

    window.addEventListener('trades-data-changed', handleChange);
    return () => window.removeEventListener('trades-data-changed', handleChange);
  }, []);

  return items;
}
