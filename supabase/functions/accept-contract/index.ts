// Supabase Edge Function: accept-contract
// Szerveroldali, auditált szerződés-elfogadás valódi IP-címmel, auth.uid() ellenőrzéssel és SHA-256 lenyomattal.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.epitotudas.hu',
  'https://epitotudas.hu',
  'http://localhost:5173',
  'http://localhost:4173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('SITE_URL') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowed = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
  const origin = req.headers.get('origin') || '';
  const allowOrigin = allowed.has(origin) ? origin : DEFAULT_ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

function extractClientIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return 'server-recorded';
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó Supabase szerver konfiguráció.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Hitelesítés szükséges a szerződés elfogadásához.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen vagy lejárt munkamenet.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const contractId = String(body.contractId || '').trim();
    const acceptedBy = String(body.personName || '').trim();
    const acceptedEmail = String(body.personEmail || '').trim().toLowerCase();

    if (!contractId || acceptedBy.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acceptedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó vagy érvénytelen szerződés-elfogadási adatok.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: contract, error: contractErr } = await adminClient
      .from('partner_contracts')
      .select('*')
      .eq('id', contractId)
      .maybeSingle();

    if (contractErr || !contract) {
      return new Response(
        JSON.stringify({ error: 'A megadott szerződés nem található az adatbázisban.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (contract.status === 'accepted') {
      return new Response(
        JSON.stringify({ error: 'Ez a szerződés már korábban elfogadásra került.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const acceptableStatuses = ['sent', 'viewed', 'pending_acceptance'];
    if (!acceptableStatuses.includes(String(contract.status || ''))) {
      return new Response(
        JSON.stringify({ error: 'Csak kiküldött vagy elfogadásra váró szerződés fogadható el.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .maybeSingle();

    const isAdmin = callerProfile?.role === 'admin';
    let isPartnerMember = false;
    if (!isAdmin) {
      const { data: membership } = await adminClient
        .from('partner_users')
        .select('id')
        .eq('partner_id', contract.partner_id)
        .eq('user_id', callerId)
        .maybeSingle();
      isPartnerMember = Boolean(membership);
    }

    if (!isAdmin && !isPartnerMember) {
      return new Response(
        JSON.stringify({ error: 'Nincs jogosultsága ehhez a partneri szerződéshez.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientIp = extractClientIp(req);
    const userAgent = req.headers.get('user-agent') || '';
    const nowIso = new Date().toISOString();
    const contentSha256 = await sha256Hex(
      `${contract.contract_number}|${contract.partner_id}|${contract.amount}|${contract.content || ''}`
    );

    const acceptanceLog = {
      acceptedBy,
      email: acceptedEmail,
      acceptedAt: nowIso,
      ipAddress: clientIp,
      userId: callerId,
      userAgent,
      contentSha256,
      serverVerified: true,
    };

    const existingVersions = Array.isArray(contract.versions) ? contract.versions : [];
    const nextVersions = [
      ...existingVersions,
      {
        versionNumber: existingVersions.length + 1,
        createdAt: nowIso,
        amount: Number(contract.amount || 0),
        content: contract.content || '',
        changeNote: `Szerződés elfogadva - Hitelesített felhasználó: ${callerId}, IP: ${clientIp}, SHA-256: ${contentSha256.slice(0, 12)}...`,
      },
    ];

    const { data: claimedRow, error: updateErr } = await adminClient
      .from('partner_contracts')
      .update({
        status: 'accepted',
        acceptance_log: acceptanceLog,
        versions: nextVersions,
        updated_at: nowIso,
      })
      .eq('id', contract.id)
      .in('status', acceptableStatuses)
      .select('id')
      .maybeSingle();

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: `Szerződés frissítési hiba: ${updateErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!claimedRow) {
      return new Response(
        JSON.stringify({ error: 'Ez a szerződés már korábban elfogadásra került.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: logErr } = await adminClient.from('contract_acceptance_logs').insert({
      contract_id: contract.id,
      partner_id: contract.partner_id,
      user_id: callerId,
      accepted_by: acceptedBy,
      accepted_email: acceptedEmail,
      ip_address: clientIp,
      user_agent: userAgent,
      content_sha256: contentSha256,
      accepted_at: nowIso,
    });

    if (logErr) {
      return new Response(
        JSON.stringify({ error: `Audit napló mentési hiba: ${logErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        contract: {
          id: contract.id,
          status: 'accepted',
          acceptanceLog,
          versions: nextVersions,
          updatedAt: nowIso,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Váratlan szerverhiba' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
