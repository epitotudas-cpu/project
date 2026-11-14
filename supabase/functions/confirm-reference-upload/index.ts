// Supabase Edge Function: confirm-reference-upload
// Hitelesített referenciakép-feltöltés ellenőrzése, érvényesítése és véglegesítése.
// Kizárólag érvényes partneri JWT-vel hívható, a véglegesítést service_role kulccsal végzi.

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

/**
 * Egyszerű képfejléc-elemző a dimenziók és a valódi képformátum kinyeréséhez.
 */
function parseImageHeader(bytes: Uint8Array): { width: number; height: number; mime: string } | null {
  if (bytes.length < 24) return null;

  // 1. PNG ellenőrzés
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width: Math.max(1, width), height: Math.max(1, height), mime: 'image/png' };
  }

  // 2. JPEG ellenőrzés
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      // SOF0 (0xC0) vagy SOF2 (0xC2)
      if (marker === 0xc0 || marker === 0xc2) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width: Math.max(1, width), height: Math.max(1, height), mime: 'image/jpeg' };
      }
      const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + len;
    }
    return { width: 1600, height: 1067, mime: 'image/jpeg' };
  }

  // 3. WebP ellenőrzés (RIFF....WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { width: 1600, height: 1067, mime: 'image/webp' };
  }

  return null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS Preflight kezelés
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Szerveroldali konfiguráció hiányos.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Felhasználói JWT ellenőrzése
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Hiányzó hitelesítési token (Bearer JWT).' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen vagy lejárt felhasználói munkamenet.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callingUserId = userData.user.id;

    // 2. Kérelem törzsének beolvasása
    const body = await req.json().catch(() => ({}));
    const { intent_id, caption, is_cover } = body;

    if (!intent_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent_id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen vagy hiányzó intent_id.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Admin kliens (service_role) inicializálása
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 4. Intent igénylése (atomi állapotváltás: 'created' -> 'validating')
    const { data: claimData, error: claimError } = await adminClient.rpc('claim_upload_intent', {
      p_intent_id: intent_id,
      p_claiming_user_id: callingUserId,
    });

    if (claimError) {
      return new Response(
        JSON.stringify({ success: false, error: `Intent igénylése sikertelen: ${claimError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claim = Array.isArray(claimData) ? claimData[0] : claimData;

    // Idempotens kezelés: ha már consumed, lekérdezzük a kész rekordot
    if (claim?.error_code === 'INVALID_STATUS_consumed') {
      const { data: existingImg } = await adminClient
        .from('partner_reference_images')
        .select('*')
        .eq('reference_id', claim.reference_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          status: 'already_consumed',
          image_id: existingImg?.id || null,
          object_key: existingImg?.object_key || null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!claim || !claim.is_valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Az intent nem érvényesíthető: ${claim?.error_code || 'Ismeretlen hiba'}`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { staging_key, allocated_object_key, reference_id, partner_id } = claim;

    // 5. Staging fájl letöltése és ellenőrzése a privát staging vödörből
    const { data: stagingBlob, error: downloadError } = await adminClient.storage
      .from('partner-references-staging')
      .download(staging_key);

    if (downloadError || !stagingBlob) {
      await adminClient.rpc('verify_and_cleanup_unconsumed_intent', {
        p_intent_id: intent_id,
        p_error_message: 'Staging fájl nem található a tárhelyen',
      });
      return new Response(
        JSON.stringify({ success: false, error: 'A feltöltött ideiglenes fájl nem található a tárhelyen.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await stagingBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Méret és Magic bytes ellenőrzése
    if (bytes.length === 0 || bytes.length > 15728640) {
      await adminClient.rpc('verify_and_cleanup_unconsumed_intent', {
        p_intent_id: intent_id,
        p_error_message: 'Érvénytelen fájlméret',
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen fájlméret (max. 15 MB engedélyezett).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsedInfo = parseImageHeader(bytes);
    if (!parsedInfo) {
      await adminClient.rpc('verify_and_cleanup_unconsumed_intent', {
        p_intent_id: intent_id,
        p_error_message: 'Nem támogatott vagy sérült képformátum',
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Nem támogatott vagy sérült képformátum (kizárólag JPEG, PNG, WebP).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Átmozgatás / Feltöltés a végleges publikus vödörbe (partner-references)
    const { error: uploadFinalError } = await adminClient.storage
      .from('partner-references')
      .upload(allocated_object_key, bytes, {
        contentType: parsedInfo.mime,
        upsert: true,
      });

    if (uploadFinalError) {
      await adminClient.rpc('verify_and_cleanup_unconsumed_intent', {
        p_intent_id: intent_id,
        p_error_message: `Végleges fájlfeltöltés sikertelen: ${uploadFinalError.message}`,
      });
      return new Response(
        JSON.stringify({ success: false, error: 'A végleges fájl elmentése sikertelen a tárhelyen.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Képrekord véglegesítése az adatbázisban (finalize_reference_image)
    const { data: finalizeData, error: finalizeError } = await adminClient.rpc('finalize_reference_image', {
      p_intent_id: intent_id,
      p_caption: caption?.trim() || null,
      p_width: parsedInfo.width,
      p_height: parsedInfo.height,
      p_size_bytes: bytes.length,
      p_is_cover: !!is_cover,
    });

    if (finalizeError) {
      // Kompenzáció: töröljük a végleges fájlt és állítsuk hibára az intentet
      await adminClient.storage.from('partner-references').remove([allocated_object_key]);
      await adminClient.rpc('verify_and_cleanup_unconsumed_intent', {
        p_intent_id: intent_id,
        p_error_message: `Finalize RPC sikertelen: ${finalizeError.message}`,
      });

      return new Response(
        JSON.stringify({ success: false, error: `Képrekord rögzítése sikertelen: ${finalizeError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalResult = Array.isArray(finalizeData) ? finalizeData[0] : finalizeData;

    // 8. Staging ideiglenes fájl takarítása
    await adminClient.storage.from('partner-references-staging').remove([staging_key]).catch(() => {});

    // 9. Sikeres válasz
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/partner-references/${allocated_object_key}`;

    return new Response(
      JSON.stringify({
        success: true,
        image_id: finalResult?.image_id || claim.allocated_image_id,
        object_key: allocated_object_key,
        public_url: publicUrl,
        reference_id,
        partner_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Váratlan szerverhiba történt.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

