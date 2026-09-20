// Supabase Edge Function: resend-email
// Alias function for email resending via Resend API.

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const { to, subject, html } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Címzett (to) és tárgy (subject) megadása kötelező.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY hiányzik a Supabase Secrets közül.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

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

    if (!res.ok) {
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
          JSON.stringify({ provider: 'Resend', fallback_used: true, ...fallbackData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    return new Response(JSON.stringify({ provider: 'Resend', ...data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.status,
    });
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
