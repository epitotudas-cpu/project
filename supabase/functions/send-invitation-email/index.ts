// Supabase Edge Function: send-invitation-email
// Serves automated email delivery for partner invitations via Resend API.
// Handles CORS OPTIONS preflights cleanly and includes automatic fallback to onboarding@resend.dev.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve?: (handler: (req: Request) => Promise<Response>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const { to, subject, html } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Címzett (to) és tárgy (subject) megadása kötelező.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: 'RESEND_API_KEY hiányzik a Supabase Secrets közül. Állítsa be a Supabase Dashboard -> Settings -> Edge Functions -> Secrets menüben.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    // Primary Email Delivery via Resend API (custom domain)
    let res = await fetch('https://api.resend.com/emails', {
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

    let data = await res.json();

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

    // Extract exact Resend error message
    const rawError = fallbackData?.message || data?.message || fallbackData?.error || data?.error || 'Szerveroldali Resend hiba';
    const errString = typeof rawError === 'string' ? rawError : JSON.stringify(rawError);

    return new Response(
      JSON.stringify({ ok: false, error: errString, primary_error: data, fallback_error: fallbackData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message || 'Szerveroldali hiba az e-mail küldésekor.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
};

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handler);
}

export default handler;
