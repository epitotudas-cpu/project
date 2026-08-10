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
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000003';

declare global {
  interface Window {
    __GLOBAL_IMPRESSUM_DATA__?: ImpressumData;
  }
}

export function getImpressumData(): ImpressumData {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_IMPRESSUM_DATA__) {
      return window.__GLOBAL_IMPRESSUM_DATA__;
    }

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

    void (async () => {
      const payloadString = JSON.stringify(data);
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_IMPRESSUM__',
          slug: 'system-impressum-config',
          description: payloadString,
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase categories impressum_data sync info:', err);
      }

      try {
        await supabase.from('ad_campaigns').upsert({
          id: SUPABASE_SYSTEM_ID,
          sponsor_name: '__SYSTEM_CONFIG_IMPRESSUM__',
          placement_slot: 'config',
          title: 'ImpressumData',
          banner_image_url: payloadString,
          status: 'system',
          start_date: new Date().toISOString(),
          impressions_count: 0,
          clicks_count: 0,
        });
      } catch (err) {
        console.warn('Supabase ad_campaigns impressum_data sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba az impresszum adatok mentésekor:', err);
  }
}

export async function fetchImpressumDataFromCloud(): Promise<ImpressumData | null> {
  try {
    let rawJson: string | null = null;

    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_SYSTEM_ID)
      .maybeSingle();

    if (!catErr && catData?.description && catData.description.startsWith('{')) {
      rawJson = catData.description;
    } else {
      const { data: adData, error: adErr } = await supabase
        .from('ad_campaigns')
        .select('banner_image_url')
        .eq('id', SUPABASE_SYSTEM_ID)
        .maybeSingle();

      if (!adErr && adData?.banner_image_url && adData.banner_image_url.startsWith('{')) {
        rawJson = adData.banner_image_url;
      }
    }

    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      const impressum: ImpressumData = {
        ...DEFAULT_IMPRESSUM_DATA,
        ...parsed,
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_IMPRESSUM_DATA__ = impressum;
        localStorage.setItem(IMPRESSUM_STORAGE_KEY, JSON.stringify(impressum));
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(impressum));
        window.dispatchEvent(new Event('impressum-data-changed'));
      }
      return impressum;
    }
  } catch (err) {
    console.warn('Cloud impressum data fetch info:', err);
  }
  return null;
}

if (typeof window !== 'undefined') {
  void fetchImpressumDataFromCloud();
}
