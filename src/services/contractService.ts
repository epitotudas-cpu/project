import {
  type AdvertisementContract,
  type ContractTemplate,
  type ContractStatus,
  type ContractAcceptanceLog,
  type ContractVersion,
} from '../lib/supabase';

export const DEFAULT_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tmpl-annual',
    name: 'Éves Partneri Szerződés Sablon',
    description: 'Gold & Silver éves partneri megállapodások automatikus generálásához',
    active: true,
    body: `REKLÁMSZOLGÁLTATÁSI MEGÁLLAPODÁS

Szerződés azonosító: {{szerzodes_szam}}
Kelt: {{kelt_datum}}

1. SZERZŐDŐ FELEK
Szolgáltató: ÉpítőTudás Kft. (Képviseli: Muck Péter ügyvezető)
Megrendelő Partner: {{partner_nev}} (Képviseli: {{kapcsolattarto_nev}}, {{kapcsolattarto_email}})

2. SZOLGÁLTATÁS TÁRGYA
A Szolgáltató reklámmegjelenési és szponzorációs felületet biztosít a Megrendelő számára az ÉpítőTudás szakmai portálon.

3. MEGJELENÉSI HELY & CSOMAG
Megjelenési felület: {{reklamhely}}
Kampány megnevezése: {{kampany_cim}}

4. IDŐTARTAM & ÉRVÉNYESSÉG
Kezdési dátum: {{kezdes}}
Lejárati dátum: {{vege}}

5. DÍJAZÁS ÉS FIZETÉSI FELTÉTELEK
Megállapodott díj: {{osszeg}} Ft + ÁFA (azaz {{osszeg}} HUF).
Fizetési mód: Banki átutalás 8 napos fizetési határidővel.

6. ELFOGADÁS ÉS JOGI KÖTELEZETTSÉGVÁLLALÁS
Jelen megállapodás a Megrendelő általi elektronikus elfogadással lép hatályba. Az elfogadás elektronikus bélyegzővel, IP cím és időbélyeg rögzítésével történik.`,
  },
  {
    id: 'tmpl-monthly',
    name: 'Havi Reklámkampány Sablon',
    description: 'Rövid távú havi banner és affiliate kampányokhoz',
    active: true,
    body: `HAVI REKLÁMKAMPÁNY MEGÁLLAPODÁS

Szerződés szám: {{szerzodes_szam}}

FELEK:
Szolgáltató: ÉpítőTudás Portál (ÉpítőTudás Kft.)
Partner: {{partner_nev}}

KAMPÁNY ÉS MEGJELENÉS:
Kampány: {{kampany_cim}}
Elhelyezés: {{reklamhely}}
Időtartam: {{kezdes}} - {{vege}}

DÍJAZÁS:
Havi díj: {{osszeg}} Ft + ÁFA
Fizetési határidő: A díj kifizetése a kampány élesítése előtt esedékes.`,
  },
  {
    id: 'tmpl-sponsored-article',
    name: 'Szponzorált Cikk Sablon',
    description: 'Szakmai cikk kiemelés ésPR cikk megjelölés sablonja',
    active: true,
    body: `SZPONZORÁLT CIKK MEGÁLLAPODÁS

Szerződés szám: {{szerzodes_szam}}
Megrendelő: {{partner_nev}}
Cikk / Kampány címe: {{kampany_cim}}
Megjelenés helye: {{reklamhely}}
Díj: {{osszeg}} Ft + ÁFA

A cikk az ÉpítőTudás szakmai kategóriáiban jelenik meg, "Szponzorált Tartalom" megjelöléssel.`,
  },
];

export const DEFAULT_CONTRACTS: AdvertisementContract[] = [
  {
    id: 'contract-101',
    contractNumber: 'ET-2026-00045',
    campaignId: 'camp-101',
    partnerId: 'partner-bosch',
    partnerName: 'Bosch Professional Magyarország',
    campaignTitle: 'Bosch Akkus Szerszámgépek & Zöld Lézeres Szintezők 2026',
    placementSlot: 'top_banner',
    templateId: 'tmpl-annual',
    status: 'accepted',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    amount: 249000,
    currency: 'HUF',
    content: '',
    versions: [
      {
        versionNumber: 1,
        createdAt: '2026-01-01 10:00',
        amount: 249000,
        content: 'Gold Éves Partneri Szerződés v1',
        changeNote: 'Kezdeti változat elkészítve',
      },
      {
        versionNumber: 2,
        createdAt: '2026-01-02 14:30',
        amount: 249000,
        content: 'Gold Éves Partneri Szerződés v2 (Módosított lejárati dátum)',
        changeNote: 'Végdátum pontosítása 2026-12-31-re',
      },
    ],
    acceptanceLog: {
      acceptedBy: 'Nagy Péter',
      email: 'peter.nagy@hu.bosch.com',
      acceptedAt: '2026-01-02 18:30:15',
      ipAddress: '185.120.45.12',
      userId: 'user-bosch-01',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    },
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T18:30:15.000Z',
  },
  {
    id: 'contract-102',
    contractNumber: 'ET-2026-00052',
    campaignId: 'camp-103',
    partnerId: 'partner-milwaukee',
    partnerName: 'Milwaukee Tool Magyarország',
    campaignTitle: 'Milwaukee Heavy Duty Fúrókalapácsok & Akkus Gépek',
    placementSlot: 'in_feed',
    templateId: 'tmpl-monthly',
    status: 'pending_acceptance',
    startDate: '2026-07-01',
    endDate: '2026-08-15',
    amount: 99000,
    currency: 'HUF',
    content: '',
    versions: [
      {
        versionNumber: 1,
        createdAt: '2026-06-25 11:00',
        amount: 99000,
        content: 'Havi Silver Reklámszerződés v1',
        changeNote: 'Szerződés kiküldve elfogadásra',
      },
    ],
    createdAt: '2026-06-25T11:00:00.000Z',
    updatedAt: '2026-06-25T11:00:00.000Z',
  },
  {
    id: 'contract-103',
    contractNumber: 'ET-2026-00058',
    campaignId: 'camp-104',
    partnerId: 'partner-cemex',
    partnerName: 'Cemex Magyarország',
    campaignTitle: 'Cemex Transzportbeton & Speciális Cementek 2026',
    placementSlot: 'sidebar',
    templateId: 'tmpl-monthly',
    status: 'draft',
    startDate: '2026-07-15',
    endDate: '2026-10-15',
    amount: 49000,
    currency: 'HUF',
    content: '',
    versions: [
      {
        versionNumber: 1,
        createdAt: '2026-07-10 15:00',
        amount: 49000,
        content: 'Bronze Oldalsáv Szerződés v1 Piszkozat',
      },
    ],
    createdAt: '2026-07-10T15:00:00.000Z',
    updatedAt: '2026-07-10T15:00:00.000Z',
  },
];

export function interpolateTemplate(
  templateBody: string,
  data: {
    szerzodes_szam: string;
    partner_nev: string;
    kapcsolattarto_nev?: string;
    kapcsolattarto_email?: string;
    kampany_cim: string;
    reklamhely: string;
    kezdes: string;
    vege: string;
    osszeg: number;
    kelt_datum?: string;
  }
): string {
  let result = templateBody;
  result = result.replace(/{{szerzodes_szam}}/g, data.szerzodes_szam);
  result = result.replace(/{{partner_nev}}/g, data.partner_nev);
  result = result.replace(/{{kapcsolattarto_nev}}/g, data.kapcsolattarto_nev || 'Felelős Vezető');
  result = result.replace(/{{kapcsolattarto_email}}/g, data.kapcsolattarto_email || 'marketing@partner.hu');
  result = result.replace(/{{kampany_cim}}/g, data.kampany_cim);
  result = result.replace(/{{reklamhely}}/g, data.reklamhely);
  result = result.replace(/{{kezdes}}/g, data.kezdes);
  result = result.replace(/{{vege}}/g, data.vege);
  result = result.replace(/{{osszeg}}/g, data.osszeg.toLocaleString('hu-HU'));
  result = result.replace(/{{kelt_datum}}/g, data.kelt_datum || new Date().toLocaleDateString('hu-HU'));
  return result;
}

const STORAGE_KEY = 'epitotudas_contracts_v1';

export function getContracts(): AdvertisementContract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Hiba a szerződések olvasásakor:', err);
  }

  // Populate interpolated content for defaults
  const filledDefaults = DEFAULT_CONTRACTS.map((c) => {
    const tmpl = DEFAULT_CONTRACT_TEMPLATES.find((t) => t.id === c.templateId) || DEFAULT_CONTRACT_TEMPLATES[0];
    const filled = interpolateTemplate(tmpl.body, {
      szerzodes_szam: c.contractNumber,
      partner_nev: c.partnerName,
      kampany_cim: c.campaignTitle,
      reklamhely: c.placementSlot === 'top_banner' ? 'Főoldali Fejléc Banner' : 'Oldalsáv / Cikk',
      kezdes: c.startDate,
      vege: c.endDate,
      osszeg: c.amount,
    });
    return { ...c, content: filled };
  });

  return filledDefaults;
}

export function saveContracts(contracts: AdvertisementContract[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    window.dispatchEvent(new Event('contracts-changed'));
  } catch (err) {
    console.error('Hiba a szerződések mentésekor:', err);
  }
}

export function acceptContractByPartner(
  contractId: string,
  personName: string,
  personEmail: string
): AdvertisementContract | null {
  const contracts = getContracts();
  const index = contracts.findIndex((c) => c.id === contractId);
  if (index === -1) return null;

  const current = contracts[index];
  const nowStr = new Date().toLocaleString('hu-HU');
  const simulatedIp = `185.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

  const acceptanceLog: ContractAcceptanceLog = {
    acceptedBy: personName,
    email: personEmail,
    acceptedAt: nowStr,
    ipAddress: simulatedIp,
    userId: `user-${Date.now()}`,
    userAgent: navigator.userAgent,
  };

  const newVersionNumber = (current.versions?.length || 0) + 1;
  const newVersion: ContractVersion = {
    versionNumber: newVersionNumber,
    createdAt: nowStr,
    amount: current.amount,
    content: current.content,
    changeNote: `Szerződés Elfogadva - Rögzített IP: ${simulatedIp}`,
  };

  const updated: AdvertisementContract = {
    ...current,
    status: 'accepted',
    acceptanceLog,
    versions: [...(current.versions || []), newVersion],
    updatedAt: new Date().toISOString(),
  };

  contracts[index] = updated;
  saveContracts(contracts);
  return updated;
}

export function updateContractStatus(contractId: string, status: ContractStatus): void {
  const contracts = getContracts();
  const index = contracts.findIndex((c) => c.id === contractId);
  if (index !== -1) {
    contracts[index].status = status;
    contracts[index].updatedAt = new Date().toISOString();
    saveContracts(contracts);
  }
}

export function addContractVersion(
  contractId: string,
  newAmount: number,
  newContent: string,
  changeNote: string
): void {
  const contracts = getContracts();
  const index = contracts.findIndex((c) => c.id === contractId);
  if (index !== -1) {
    const current = contracts[index];
    const newVersionNum = (current.versions?.length || 0) + 1;
    const newVer: ContractVersion = {
      versionNumber: newVersionNum,
      createdAt: new Date().toLocaleString('hu-HU'),
      amount: newAmount,
      content: newContent,
      changeNote,
    };

    contracts[index] = {
      ...current,
      amount: newAmount,
      content: newContent,
      status: 'pending_acceptance',
      versions: [...(current.versions || []), newVer],
      updatedAt: new Date().toISOString(),
    };
    saveContracts(contracts);
  }
}
