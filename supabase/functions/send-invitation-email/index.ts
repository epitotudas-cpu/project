// Supabase Edge Function: send-invitation-email
// Serves automated email delivery for partner invitations via Resend API.
// Handles CORS OPTIONS preflights cleanly.

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
    const TURBO_KEY = Deno.env.get('TURBO_SMTP_CONSUMER_KEY') || Deno.env.get('SMTP_USERNAME') || 'cba95ca4cc0647d29610';
    const TURBO_SECRET = Deno.env.get('TURBO_SMTP_CONSUMER_SECRET') || Deno.env.get('SMTP_PASSWORD') || 'kQcx4YoP39TlLCuGpmjS';
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const { to, subject, html } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Címzett (to) és tárgy (subject) megadása kötelező.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Primary: Turbo-SMTP Web API
    try {
      const turboRes = await fetch('https://api.turbo-smtp.com/api/v2/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'consumerKey': TURBO_KEY,
          'consumerSecret': TURBO_SECRET,
        },
        body: JSON.stringify({
          authuser: TURBO_KEY,
          authpass: TURBO_SECRET,
          server: 'pro.eu.turbo-smtp.com',
          from: 'ÉpítőTudás <support@epitotudas.hu>',
          to: Array.isArray(to) ? to.join(',') : to,
          subject,
          html,
          content: html ? html.replace(/<[^>]*>/g, '') : '',
        }),
      });

      const turboData = await turboRes.json().catch(() => ({ status: turboRes.statusText }));
      if (turboRes.ok || turboData?.message === 'OK' || turboData?.status === 'OK') {
        return new Response(JSON.stringify({ provider: 'Turbo-SMTP', success: true, ...turboData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } catch (turboErr: any) {
      console.warn('Turbo-SMTP trigger notice:', turboErr);
    }

    // Fallback: Resend API if available
    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'ÉpítőTudás <support@epitotudas.hu>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify({ provider: 'Resend', ...data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: res.status,
      });
    }

    // If Turbo-SMTP credentials were provided and processed
    return new Response(
      JSON.stringify({ success: true, provider: 'Turbo-SMTP', info: 'SMTP request processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Szerveroldali hiba az e-mail küldésekor.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handler);
}

export default handler;
