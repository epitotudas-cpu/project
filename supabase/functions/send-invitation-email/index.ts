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

    const { to, subject, html } = await req.json();
    const recipients = (Array.isArray(to) ? to : [to])
      .map((r) => String(r || '').trim())
      .filter(Boolean);

    if (
      recipients.length === 0 ||
      recipients.some((r) => !EMAIL_REGEX.test(r)) ||
      typeof subject !== 'string' ||
      !subject.trim()
    ) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Érvényes címzett (to) és tárgy (subject) megadása kötelező.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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
        subject,
        html,
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
        subject,
        html,
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
