// Supabase Edge Function: cleanup-reference-storage
// Háttérfolyamat az árva és törölt Storage objektumok fizikai eltávolítására.
// A pending_storage_deletions feladatsor alapján hajtja végre a törlést.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const cronSecret = Deno.env.get('CRON_SECRET') || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Konfiguráció hiányos.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const requestCronSecret = req.headers.get('x-cron-secret') || '';
  const isAuthorizedService = authHeader === `Bearer ${serviceRoleKey}`;
  const isAuthorizedCron = Boolean(cronSecret) && requestCronSecret === cronSecret;

  if (!isAuthorizedService && !isAuthorizedCron) {
    return new Response(JSON.stringify({ error: 'Jogosulatlan hívás.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Lejárt intentek megjelölése és bejegyzése a törlési queue-ba
    await adminClient.rpc('cleanup_expired_upload_intents', { p_batch_size: 50 });

    // 2. Feladatok foglalása a queue-ból
    const { data: tasks, error: claimErr } = await adminClient.rpc('claim_storage_deletion_tasks', {
      p_batch_size: 20,
    });

    if (claimErr) {
      return new Response(JSON.stringify({ error: claimErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const taskList = Array.isArray(tasks) ? tasks : [];
    let deletedCount = 0;

    for (const task of taskList) {
      try {
        const keysToRemove: string[] = [];
        if (task.object_key) keysToRemove.push(task.object_key);
        if (task.thumb_key) keysToRemove.push(task.thumb_key);

        if (keysToRemove.length > 0) {
          // Ha staging fájl, a staging vödörből, egyébként a végleges vödörből törlünk
          const isStaging = task.object_key?.startsWith('staging/');
          const targetBucket = isStaging ? 'partner-references-staging' : 'partner-references';

          await adminClient.storage.from(targetBucket).remove(keysToRemove);
        }

        // Feladat lezárása
        await adminClient.rpc('complete_storage_deletion_task', {
          p_task_id: task.task_id,
          p_lock_token: task.lock_token,
        });
        deletedCount++;
      } catch (err: unknown) {
        await adminClient.rpc('fail_storage_deletion_task', {
          p_task_id: task.task_id,
          p_lock_token: task.lock_token,
          p_error_message: err instanceof Error ? err.message : 'Ismeretlen törlési hiba',
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: taskList.length, deleted: deletedCount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Hiba a takarítás során' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

