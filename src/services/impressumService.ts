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

export function getImpressumData(): ImpressumData {
  try {
    const raw = localStorage.getItem(IMPRESSUM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_IMPRESSUM_DATA,
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Hiba az impresszum adatok betöltésekor:', err);
  }
  return DEFAULT_IMPRESSUM_DATA;
}

export function saveImpressumData(data: ImpressumData): void {
  try {
    localStorage.setItem(IMPRESSUM_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('impressum-data-changed'));
  } catch (err) {
    console.error('Hiba az impresszum adatok mentésekor:', err);
  }
}
