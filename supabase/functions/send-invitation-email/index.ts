// Supabase Edge Function: send-invitation-email
// Serves automated email delivery for partner invitations via Resend API.
// Secret key must be stored in Supabase secrets (RESEND_API_KEY).

// Global Deno type declaration for IDE compatibility
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

interface EmailPayload {
  to: string;
  contact_name?: string;
  organization_name: string;
  invite_code: string;
  invite_link: string;
  expires_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_API_KEY is not configured in Supabase Edge Function secrets.',
          requires_manual_fallback: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.invite_code || !payload.organization_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Hiányzó kötelező e-mail paraméterek.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const formattedDate = new Date(payload.expires_at).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const greeting = payload.contact_name ? `Kedves ${payload.contact_name}!` : 'Tisztelt Partnerünk!';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
        <h2 style="color: #d97706; margin-top: 0;">ÉpítőTudás v2 – Meghívás Szervezeti Partnerré</h2>
        <p>${greeting}</p>
        <p>Örömmel értesítjük, hogy meghívást kapott az ÉpítőTudás platformra a(z) <strong>${payload.organization_name}</strong> szervezet nevében.</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #475569;">Az Ön egyedi meghívókódja:</p>
          <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: bold; font-family: monospace; color: #b45309; letter-spacing: 2px;">${payload.invite_code}</p>
        </div>

        <p>A regisztráció és a szervezet összekapcsolásához kérjük, kattintson az alábbi gombra:</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${payload.invite_link}" style="background-color: #f59e0b; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Meghívás Elfogadása & Regisztráció</a>
        </p>

        <p style="font-size: 13px; color: #64748b;">
          A meghívókód kizárólag erről az e-mail címről (<strong>${payload.to}</strong>) váltható be.<br>
          <strong>Érvényességi idő:</strong> ${formattedDate}
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">ÉpítőTudás v2 – Szakmai Tudásplatform</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'ÉpítőTudás <no-reply@epitotudas.hu>',
        to: [payload.to],
        subject: `Meghívás az ÉpítőTudás partneri rendszerébe (${payload.organization_name})`,
        html: htmlBody,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: resData.message || 'Hiba az e-mail kiküldésekor.',
          requires_manual_fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: resData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Szerveroldali hiba az e-mail küldésekor.',
        requires_manual_fallback: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handler);
}

export default handler;
