import {
  supabase,
  type AdvertisementContract,
  type ContractTemplate,
  type ContractStatus,
  type ContractAcceptanceLog,
  type ContractVersion,
} from '../lib/supabase';
import { readAppConfig, writeAppConfig } from './appConfigService';

const CONTRACTS_CONFIG_KEY = '__SYSTEM_CONFIG_CONTRACTS__';

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

export async function saveContracts(contracts: AdvertisementContract[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    window.dispatchEvent(new Event('contracts-changed'));
    await writeAppConfig(CONTRACTS_CONFIG_KEY, contracts);
  } catch (err) {
    console.error('Hiba a szerződések mentésekor:', err);
    throw err;
  }
}

function mapContractRow(row: Record<string, unknown>): AdvertisementContract {
  return {
    id: String(row.id),
    contractNumber: String(row.contract_number || ''),
    campaignId: String(row.campaign_id || ''),
    partnerId: String(row.partner_id || ''),
    partnerName: String(row.partner_name || ''),
    campaignTitle: String(row.campaign_title || ''),
    placementSlot: String(row.placement_slot || 'top_banner'),
    templateId: String(row.template_id || 'tmpl-annual'),
    status: (row.status as ContractStatus) || 'draft',
    startDate: String(row.start_date || ''),
    endDate: String(row.end_date || ''),
    amount: Number(row.amount || 0),
    currency: 'HUF',
    content: String(row.content || ''),
    versions: Array.isArray(row.versions) ? (row.versions as ContractVersion[]) : [],
    acceptanceLog: (row.acceptance_log as ContractAcceptanceLog | null) ?? undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

async function computeContractSha256(contract: AdvertisementContract): Promise<string | undefined> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return undefined;
    const payload = `${contract.contractNumber}|${contract.partnerId}|${contract.amount}|${contract.content || ''}`;
    const bytes = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return undefined;
  }
}

export async function upsertContractInCloud(contract: AdvertisementContract): Promise<void> {
  const { error } = await supabase
    .from('partner_contracts' as never)
    .upsert({
      id: contract.id,
      contract_number: contract.contractNumber,
      campaign_id: contract.campaignId,
      partner_id: contract.partnerId,
      partner_name: contract.partnerName,
      campaign_title: contract.campaignTitle,
      placement_slot: contract.placementSlot,
      template_id: contract.templateId,
      status: contract.status,
      start_date: contract.startDate,
      end_date: contract.endDate,
      amount: contract.amount,
      currency: contract.currency,
      content: contract.content,
      versions: contract.versions,
      acceptance_log: contract.acceptanceLog ?? null,
      created_at: contract.createdAt,
      updated_at: contract.updatedAt,
    } as never);

  if (error) {
    console.warn('partner_contracts upsert fallback notice:', error.message);
  }
}

export async function deleteContractInCloud(contractId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_contracts' as never)
    .delete()
    .eq('id', contractId);

  if (error) {
    console.warn('partner_contracts delete fallback notice:', error.message);
  }
}

export async function fetchContractsFromCloud(partnerId?: string): Promise<AdvertisementContract[]> {
  try {
    let query = supabase
      .from('partner_contracts' as never)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped = data.map((r) => mapContractRow(r as Record<string, unknown>));
      if (!partnerId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        window.dispatchEvent(new Event('contracts-changed'));
      }
      return mapped;
    }
  } catch (err) {
    console.warn('partner_contracts lekérdezési hiba:', err);
  }

  try {
    const cloud = await readAppConfig<AdvertisementContract[]>(CONTRACTS_CONFIG_KEY);
    if (Array.isArray(cloud) && cloud.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
      window.dispatchEvent(new Event('contracts-changed'));
      return partnerId ? cloud.filter((c) => c.partnerId === partnerId) : cloud;
    }
  } catch (err) {
    console.warn('Szerződések felhőből olvasási hiba:', err);
  }

  const local = getContracts();
  return partnerId ? local.filter((c) => c.partnerId === partnerId) : local;
}

export async function acceptContractByPartner(
  contractId: string,
  personName: string,
  personEmail: string
): Promise<AdvertisementContract> {
  const cleanName = personName.trim();
  const cleanEmail = personEmail.trim().toLowerCase();

  if (cleanName.length < 2) {
    throw new Error('Kérjük, adja meg az elfogadó teljes nevét.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Kérjük, adjon meg egy érvényes e-mail-címet.');
  }

  const contracts = getContracts();
  const index = contracts.findIndex((c) => c.id === contractId);
  const existing = index !== -1 ? contracts[index] : undefined;

  if (existing?.status === 'accepted') {
    throw new Error('Ez a szerződés már korábban elfogadásra került.');
  }

  // 1. Primary secure path: Edge Function (records real server IP, auth.uid(), UA, SHA-256)
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke('accept-contract', {
    body: {
      contractId,
      personName: cleanName,
      personEmail: cleanEmail,
    },
  });

  if (!edgeError && edgeData && !(edgeData as { error?: string }).error) {
    const serverContract = (edgeData as { contract?: Partial<AdvertisementContract> }).contract;
    if (serverContract) {
      const merged: AdvertisementContract = {
        ...(existing || ({ id: contractId } as AdvertisementContract)),
        ...serverContract,
        status: 'accepted',
      };
      const nextList = existing
        ? contracts.map((c) => (c.id === contractId ? merged : c))
        : [merged, ...contracts];
      await saveContracts(nextList);
      return merged;
    }
  }

  const edgeMsg = (edgeData as { error?: string } | null)?.error || edgeError?.message || '';
  if (
    edgeMsg &&
    !edgeMsg.includes('Failed to send') &&
    !edgeMsg.includes('Relay Error') &&
    !edgeMsg.includes('not found') &&
    !edgeMsg.includes('404')
  ) {
    throw new Error(edgeMsg);
  }

  // 2. Secondary secure path: PostgreSQL SECURITY DEFINER RPC
  const sha256 = existing ? await computeContractSha256(existing) : undefined;
  const { data: rpcData, error: rpcError } = await supabase.rpc('accept_partner_contract', {
    p_contract_id: contractId,
    p_accepted_by: cleanName,
    p_accepted_email: cleanEmail,
    p_content_sha256: sha256 ?? null,
  });

  if (!rpcError && rpcData) {
    const serverContract = rpcData as Partial<AdvertisementContract>;
    const merged: AdvertisementContract = {
      ...(existing || ({ id: contractId } as AdvertisementContract)),
      ...serverContract,
      status: 'accepted',
    };
    const nextList = existing
      ? contracts.map((c) => (c.id === contractId ? merged : c))
      : [merged, ...contracts];
    await saveContracts(nextList);
    return merged;
  }

  const rpcMsg = rpcError?.message || '';
  if (
    rpcMsg &&
    !rpcMsg.includes('Could not find the function') &&
    !rpcMsg.includes('does not exist') &&
    !rpcMsg.includes('not found')
  ) {
    throw new Error(rpcMsg);
  }

  // 3. Offline / unmigrated fallback: never fabricate a fake IP address
  if (!existing) {
    throw new Error('A szerződés nem található.');
  }

  const { data: userRes } = await supabase.auth.getUser();
  const realUserId = userRes?.user?.id;
  if (!realUserId) {
    throw new Error('Hitelesítés szükséges a szerződés elfogadásához.');
  }

  const nowIso = new Date().toISOString();
  const acceptanceLog: ContractAcceptanceLog = {
    acceptedBy: cleanName,
    email: cleanEmail,
    acceptedAt: nowIso,
    ipAddress: 'server-unavailable',
    userId: realUserId,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    contentSha256: sha256,
    serverVerified: false,
  };

  const newVersionNumber = (existing.versions?.length || 0) + 1;
  const newVersion: ContractVersion = {
    versionNumber: newVersionNumber,
    createdAt: nowIso,
    amount: existing.amount,
    content: existing.content,
    changeNote: `Szerződés elfogadva (helyi tartalék mód, felhasználó: ${realUserId})`,
  };

  const updated: AdvertisementContract = {
    ...existing,
    status: 'accepted',
    acceptanceLog,
    versions: [...(existing.versions || []), newVersion],
    updatedAt: nowIso,
  };

  const nextList = contracts.map((c) => (c.id === contractId ? updated : c));
  await saveContracts(nextList);
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
