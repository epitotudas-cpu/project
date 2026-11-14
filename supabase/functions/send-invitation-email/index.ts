// Supabase Edge Function: send-invitation-email
// Serves automated email delivery for partner invitations via Resend API.
// Handles CORS OPTIONS preflights cleanly and includes automatic fallback to onboarding@resend.dev.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve?: (handler: (req: Request) => Promise<Response>) => void;
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

const ALLOWED_EMAIL_ROLES = new Set(['admin', 'editor', 'moderator', 'partner', 'school', 'teacher']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey;

    if (!token || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Hitelesítés szükséges.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey,
      },
    });
    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Érvénytelen vagy lejárt munkamenet.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userData = await userRes.json();
    const userId = userData?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Felhasználói azonosító nem található.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey || token}`,
          apikey: serviceRoleKey || supabaseKey,
        },
      }
    );
    const profiles = profileRes.ok ? await profileRes.json() : [];
    const role = Array.isArray(profiles) && profiles[0]?.role ? String(profiles[0].role) : '';
    if (!ALLOWED_EMAIL_ROLES.has(role)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Nincs jogosultság meghívó e-mail küldéséhez.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const body = await req.json();
    const invitationId = typeof body?.invitation_id === 'string' ? body.invitation_id.trim() : '';
    const contactName = typeof body?.contact_name === 'string' ? body.contact_name.trim() : '';

    let recipients: string[] = [];
    let finalSubject = '';
    let finalHtml = '';

    if (invitationId) {
      const invRes = await fetch(
        `${supabaseUrl}/rest/v1/partner_invitations?id=eq.${encodeURIComponent(invitationId)}&select=id,email,code,partner_id,organization_name,expires_at,created_by,partners(name)`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey || token}`,
            apikey: serviceRoleKey || supabaseKey,
          },
        }
      );
      const invList = invRes.ok ? await invRes.json() : [];
      const inv = Array.isArray(invList) ? invList[0] : null;

      if (!inv || !inv.email || !EMAIL_REGEX.test(String(inv.email))) {
        return new Response(
          JSON.stringify({ ok: false, error: 'A meghívó nem található vagy érvénytelen az e-mail címe.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      let isAuthorized = role === 'admin' || role === 'editor' || inv.created_by === userId;
      if (!isAuthorized && inv.partner_id) {
        const memberRes = await fetch(
          `${supabaseUrl}/rest/v1/partner_users?partner_id=eq.${encodeURIComponent(inv.partner_id)}&user_id=eq.${encodeURIComponent(userId)}&member_role=in.(owner,admin)&select=id`,
          {
            headers: {
              Authorization: `Bearer ${serviceRoleKey || token}`,
              apikey: serviceRoleKey || supabaseKey,
            },
          }
        );
        const members = memberRes.ok ? await memberRes.json() : [];
        isAuthorized = Array.isArray(members) && members.length > 0;
      }

      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Nincs jogosultság ehhez a meghívóhoz.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      const siteOrigin = (Deno.env.get('SITE_URL') || 'https://www.epitotudas.hu').replace(/\/+$/, '');
      const inviteLink = `${siteOrigin}/#register?code=${encodeURIComponent(String(inv.code || ''))}`;
      const joinedPartner = Array.isArray(inv.partners) ? inv.partners[0] : inv.partners;
      const orgName = String(inv.organization_name || joinedPartner?.name || 'Szervezet');
      const safeOrgName = escapeHtml(orgName);
      const safeGreeting = contactName ? `Kedves ${escapeHtml(contactName)}!` : 'Tisztelt Partnerünk!';
      const safeCode = escapeHtml(String(inv.code || ''));
      const safeEmail = escapeHtml(String(inv.email));
      const formattedDate = inv.expires_at
        ? new Date(inv.expires_at).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

      recipients = [String(inv.email).trim()];
      finalSubject = `Meghívás az ÉpítőTudás partneri rendszerébe (${orgName})`;
      finalHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
          <h2 style="color: #d97706; margin-top: 0;">ÉpítőTudás v2 – Meghívás Szervezeti Partnerré</h2>
          <p>${safeGreeting}</p>
          <p>Örömmel értesítjük, hogy meghívást kapott az ÉpítőTudás platformra a(z) <strong>${safeOrgName}</strong> szervezet nevében.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; font-size: 14px; color: #475569;">Az Ön egyedi meghívókódja:</p>
            <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: bold; font-family: monospace; color: #b45309; letter-spacing: 2px;">${safeCode}</p>
          </div>
          <p>A regisztráció és a szervezet összekapcsolásához kérjük, kattintson az alábbi gombra:</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${inviteLink}" style="background-color: #f59e0b; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Meghívás Elfogadása &amp; Regisztráció</a>
          </p>
          <p style="font-size: 13px; color: #64748b;">
            A meghívókód kizárólag erről az e-mail címről (<strong>${safeEmail}</strong>) váltható be.${formattedDate ? `<br><strong>Érvényességi idő:</strong> ${escapeHtml(formattedDate)}` : ''}
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">ÉpítőTudás v2 – Szakmai Tudásplatform</p>
        </div>
      `;
    } else {
      if (role !== 'admin') {
        return new Response(
          JSON.stringify({ ok: false, error: 'Meghívó azonosító (invitation_id) megadása kötelező.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      const { to, subject, html } = body || {};
      recipients = (Array.isArray(to) ? to : [to])
        .map((r) => String(r || '').trim())
        .filter(Boolean);

      if (
        recipients.length === 0 ||
        recipients.length > MAX_RECIPIENTS ||
        recipients.some((r) => !EMAIL_REGEX.test(r)) ||
        typeof subject !== 'string' ||
        !subject.trim()
      ) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Érvényes címzett (to) és tárgy (subject) megadása kötelező.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      finalSubject = subject;
      finalHtml = typeof html === 'string' ? html : '';
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: 'RESEND_API_KEY hiányzik a szerver konfigurációból.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Primary Email Delivery via Resend API (custom domain)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ÉpítőTudás <info@epitotudas.hu>',
        to: recipients,
        subject: finalSubject,
        html: finalHtml,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify({ ok: true, provider: 'Resend', ...data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fallback attempt if custom domain fails (e.g. domain not verified in Resend)
    console.warn('Primary sender info@epitotudas.hu failed, attempting onboarding@resend.dev fallback:', data);
    const fallbackRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ÉpítőTudás <onboarding@resend.dev>',
        to: recipients,
        subject: finalSubject,
        html: finalHtml,
      }),
    });

    const fallbackData = await fallbackRes.json();
    if (fallbackRes.ok) {
      return new Response(
        JSON.stringify({ ok: true, provider: 'Resend', fallback_used: true, ...fallbackData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.error('Resend invitation email delivery failed:', { primary: data, fallback: fallbackData });
    return new Response(
      JSON.stringify({ ok: false, error: 'A meghívó e-mail kézbesítése sikertelen volt.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
    );
  } catch (err: unknown) {
    console.error('send-invitation-email exception:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Szerveroldali hiba az e-mail küldésekor.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handler);
}

export default handler;
