import { supabase } from '../lib/supabase';

export interface ImpressumData {
  companyName: string;
  regNumber: string;
  taxNumber: string;
  address: string;
  email: string;
  phone: string;
  hostingName: string;
  hostingAddress: string;
  hostingWebsite: string;
  copyrightHeading: string;
  copyrightContent: string;
  effectiveDate: string;
  version: string;
}

export const DEFAULT_IMPRESSUM_DATA: ImpressumData = {
  companyName: 'ÉpítőTudás Digitális Kft.',
  regNumber: '01-09-123456',
  taxNumber: '12345678-2-41',
  address: '1054 Budapest, Kossuth Lajos tér 1.',
  email: 'info@epitotudas.hu',
  phone: '+36 1 234 5678',
  hostingName: 'Cloudflare Pages / Cloudflare Inc.',
  hostingAddress: '101 Townsend St, San Francisco, CA 94107, USA',
  hostingWebsite: 'https://pages.cloudflare.com',
  copyrightHeading: '3. Szerzői jogok és tartalomhasználat',
  copyrightContent:
    'Az ÉpítőTudás platformon található cikkek, szakkifejezések, ábrák és oktatási anyagok a szolgáltató, illetve a tartalomtárs partnerek szellemi tulajdonát képezik. A tartalmak személyes és oktatási célú felhasználása díjmentes, az üzleti célú újrahasznosítás vagy engedély nélküli átvétel írásbeli hozzájáruláshoz kötött.',
  effectiveDate: '2026. július 28.',
  version: '1.0.0',
};

const IMPRESSUM_STORAGE_KEY = 'epitotudas_impressum_data_v1';
const BACKUP_STORAGE_KEY = 'epitotudas_impressum_data_backup_v1';

declare global {
  interface Window {
    __GLOBAL_IMPRESSUM_DATA__?: ImpressumData;
  }
}

export function getImpressumData(): ImpressumData {
  // 1. Check in-memory global window cache first
  if (typeof window !== 'undefined' && window.__GLOBAL_IMPRESSUM_DATA__) {
    return window.__GLOBAL_IMPRESSUM_DATA__;
  }

  // 2. Check primary and backup localStorage
  try {
    const raw = localStorage.getItem(IMPRESSUM_STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const data: ImpressumData = {
        ...DEFAULT_IMPRESSUM_DATA,
        ...parsed,
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_IMPRESSUM_DATA__ = data;
      }
      return data;
    }
  } catch (err) {
    console.error('Hiba az impresszum adatok betöltésekor:', err);
  }

  // 3. Fallback
  if (typeof window !== 'undefined') {
    window.__GLOBAL_IMPRESSUM_DATA__ = DEFAULT_IMPRESSUM_DATA;
  }
  return DEFAULT_IMPRESSUM_DATA;
}

export function saveImpressumData(data: ImpressumData): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_IMPRESSUM_DATA__ = data;
    }
    localStorage.setItem(IMPRESSUM_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('impressum-data-changed'));

    // Asynchronously attempt Supabase sync
    void (async () => {
      try {
        await supabase.from('site_config').upsert({ id: 'impressum_data', value: data } as any);
      } catch (err) {
        void err;
      }
    })();
  } catch (err) {
    console.error('Hiba az impresszum adatok mentésekor:', err);
  }
}
