export interface LegalDocMetadata {
  title: string;
  lastUpdated: string;
  version: string;
}

export const LEGAL_METADATA = {
  effectiveDate: '2026. július 28.',
  version: '1.0.0',
  company: {
    name: 'ÉpítőTudás Digitális Kft.',
    regNumber: '01-09-123456',
    taxNumber: '12345678-2-41',
    address: '1054 Budapest, Kossuth Lajos tér 1.',
    email: 'info@epitotudas.hu',
    phone: '+36 1 234 5678',
    hostingProvider: 'Cloudflare Inc., 101 Townsend St, San Francisco, CA 94107, USA',
  },
};

export const IMPRESSUM_DATA = {
  title: 'Impresszum',
  lastUpdated: LEGAL_METADATA.effectiveDate,
  version: LEGAL_METADATA.version,
  sections: [
    {
      heading: '1. Szolgáltató adatai',
      details: [
        { label: 'Hivatalos név', value: LEGAL_METADATA.company.name },
        { label: 'Cégjegyzékszám', value: LEGAL_METADATA.company.regNumber },
        { label: 'Adószám', value: LEGAL_METADATA.company.taxNumber },
        { label: 'Székhely', value: LEGAL_METADATA.company.address },
        { label: 'Központi email', value: LEGAL_METADATA.company.email },
        { label: 'Telefonszám', value: LEGAL_METADATA.company.phone },
      ],
    },
    {
      heading: '2. Tárhelyszolgáltató adatai',
      details: [
        { label: 'Név', value: 'Cloudflare Pages / Cloudflare Inc.' },
        { label: 'Cím', value: LEGAL_METADATA.company.hostingProvider },
        { label: 'Weboldal', value: 'https://pages.cloudflare.com' },
      ],
    },
    {
      heading: '3. Szerzői jogok és tartalomhasználat',
      content:
        'Az ÉpítőTudás platformon található cikkek, szakkifejezések, ábrák és oktatási anyagok a szolgáltató, illetve a tartalomtárs partnerek szellemi tulajdonát képezik. A tartalmak személyes és oktatási célú felhasználása díjmentes, az üzleti célú újrahasznosítás vagy engedély nélküli átvétel írásbeli hozzájáruláshoz kötött.',
    },
  ],
};

export const PRIVACY_POLICY_DATA = {
  title: 'Adatkezelési Tájékoztató (GDPR)',
  lastUpdated: LEGAL_METADATA.effectiveDate,
  version: LEGAL_METADATA.version,
  sections: [
    {
      title: '1. Az adatkezelő adatai és elérhetőségei',
      text: `Az ÉpítőTudás platform üzemeltetője mint Adatkezelő: ${LEGAL_METADATA.company.name} (székhely: ${LEGAL_METADATA.company.address}, email: ${LEGAL_METADATA.company.email}). Az Adatkezelő elkötelezett a felhasználók személyes adatainak védelme és a GDPR (EU 2016/679 rendelet) teljes körű betartása mellett.`,
    },
    {
      title: '2. A kezelt adatok körére vonatkozó szabályok',
      text: 'A platform használata során az alábbi adatcsoportokat kezeljük:',
      list: [
        'Regisztrált felhasználók: Email cím, teljes név, választott jelszó (titkosított hash-ként tárolva), profilkép URL.',
        'Kapcsolattartási adatok: Ügyfélszolgálati üzenetváltások és értesítési beállítások.',
        'Munkamenet adatok: Bejelentkezési tokenek, biztonsági naplók és cookie preferenciák.',
      ],
    },
    {
      title: '3. Az adatkezelés célja és jogalapja',
      text: 'Az adatok kezelésének jogalapja az érintett hozzájárulása (GDPR 6. cikk (1) a)), valamint a szolgáltatási szerződés teljesítése (GDPR 6. cikk (1) b)). A bejelentkezési adatok és naplók kezelése a platform biztonságának fenntartásához fűződő jogos érdek alapján történik.',
    },
    {
      title: '4. Adatfeldolgozók és adattovábbítás',
      text: 'A platform működtetéséhez az alábbi megbízható infrastruktúra-szolgáltatókat használjuk:',
      list: [
        'Supabase Inc. (Adatbázis, hitelesítés és felhőinfrastruktúra - RLS védelemmel)',
        'Cloudflare Inc. (CDN, frontend tárhely és DDoS elleni védelem)',
      ],
    },
    {
      title: '5. Az érintettek jogai',
      text: 'Felhasználóinkat megilleti a hozzáférés joga, a helyesbítéshez való jog, a törléshez ("elfeledtetéshez") való jog, az adatkezelés korlátozásának joga, az adathordozhatóság joga, valamint a tiltakozási jog. Kérelmét az info@epitotudas.hu címen terjesztheti elő.',
    },
  ],
};

export const TERMS_DATA = {
  title: 'Általános Szerződési Feltételek (ÁSZF)',
  lastUpdated: LEGAL_METADATA.effectiveDate,
  version: LEGAL_METADATA.version,
  sections: [
    {
      title: '1. Általános rendelkezések',
      text: `Jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) szabályozzák a ${LEGAL_METADATA.company.name} által üzemeltetett ÉpítőTudás platform használatát. A regisztrációval és a weboldal használatával a Felhasználó elfogadja a jelen ÁSZF rendelkezéseit.`,
    },
    {
      title: '2. A szolgáltatás leírása',
      text: 'Az ÉpítőTudás egy építőipari szakmai tudásbázis, amely cikkeket, szakmai szakkifejezéseket (fogalomtár), szerszám- és alapanyag katalógust, valamint oktatási segédanyagokat biztosít.',
    },
    {
      title: '3. Regisztráció és fiókkezelés',
      text: 'A tartalom olvasása díjmentes. Bizonyos funkciók (pl. profilkezelés, kedvencek, tartalom beküldése) regisztrációhoz kötöttek. A Felhasználó köteles valós adatokat megadni és a fiókja hozzáférési adatait bizalmasan kezelni.',
    },
    {
      title: '4. Felelősségkorlátozás',
      text: 'A platformon található szakmai cikkek és tanácsok tájékoztató jellegűek. A szolgáltató mindent megtesz az adatok pontosságáért, de nem vállal közvetlen jogi felelősséget a kivitelezési munkák során bekövetkező egyéni károkért.',
    },
  ],
};

export const COOKIE_POLICY_DATA = {
  title: 'Cookie (Süti) Szabályzat',
  lastUpdated: LEGAL_METADATA.effectiveDate,
  version: LEGAL_METADATA.version,
  types: [
    {
      name: 'Elengedhetetlen (Szükséges) sütik',
      description: 'A weboldal alapvető működéséhez, bejelentkezéshez és a biztonságos munkamenethez elengedhetetlenek.',
      required: true,
    },
    {
      name: 'Funkcionális sütik',
      description: 'Lehetővé teszik a felhasználói beállítások (pl. témakörök, böngészési beállítások) megjegyzését.',
      required: false,
    },
    {
      name: 'Analitikai és teljesítmény sütik',
      description: 'Segítenek megérteni az oldal látogatottságát és a legnépszerűbb cikket a szolgáltatás fejlesztése érdekében.',
      required: false,
    },
  ],
};
