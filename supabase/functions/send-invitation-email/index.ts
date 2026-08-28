// Supabase Edge Function: send-invitation-email
// Serves automated email delivery for partner invitations via Resend API.
// Secret key must be stored in Supabase secrets (RESEND_API_KEY).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

export default {
  fetch: withSupabase({ auth: "user" }, async (req: Request) => {
    const { to, subject, html } = await req.json();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Építő Tudás <support@epitotudas.hu>",
        to,
        subject,
        html,
      }),
    });
    const data = await res.json();

    return Response.json(data);
  }),
};
