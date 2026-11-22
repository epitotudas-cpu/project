// Supabase Edge Function: partner-material-images
// Biztonságos partneri termékkép-feltöltés és -törlés Cloudflare R2 S3-kompatibilis API-n keresztül.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    Vary: 'Origin',
  };
}

function jsonResponse(
  corsHeaders: Record<string, string>,
  status: number,
  payload: Record<string, unknown>
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function detectImageType(bytes: Uint8Array): { mime: 'image/jpeg' | 'image/png' | 'image/webp'; ext: 'jpg' | 'png' | 'webp' } | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
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
    return { mime: 'image/png', ext: 'png' };
  }

  // WebP: RIFF....WEBP
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
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return toHex(hash);
}

async function hmacSha256(key: ArrayBuffer | Uint8Array | string, msg: string): Promise<ArrayBuffer> {
  const rawKey = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(msg));
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

function getR2Config(): R2Config | null {
  const accountId = (Deno.env.get('R2_ACCOUNT_ID') || '').trim();
  const accessKeyId = (Deno.env.get('R2_ACCESS_KEY_ID') || '').trim();
  const secretAccessKey = (Deno.env.get('R2_SECRET_ACCESS_KEY') || '').trim();
  const bucketName = (Deno.env.get('R2_BUCKET_NAME') || '').trim();
  const publicUrl = (Deno.env.get('R2_PUBLIC_URL') || '').trim().replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

async function signedR2Request(
  cfg: R2Config,
  method: 'PUT' | 'DELETE',
  objectKey: string,
  body?: Uint8Array,
  contentType?: string
): Promise<Response> {
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = objectKey
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const canonicalUri = `/${encodeURIComponent(cfg.bucketName)}/${encodedKey}`;
  const url = `https://${host}${canonicalUri}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const payloadHash = body ? await sha256Hex(body) : await sha256Hex('');
  const headersToSign: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) {
    headersToSign['content-type'] = contentType;
  }

  const sortedHeaderKeys = Object.keys(headersToSign).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headersToSign[k]}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = await hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return await fetch(url, {
    method,
    headers: {
      ...headersToSign,
      Authorization: authorization,
    },
    body: body ? (body as BodyInit) : undefined,
  });
}

function sanitizeProductSegment(raw?: string | null): string {
  const cleaned = (raw || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned.length > 0 ? cleaned.slice(0, 64) : 'draft';
}

function extractR2ObjectKey(imageUrl: string, publicUrl: string): string | null {
  try {
    const base = new URL(publicUrl);
    const target = new URL(imageUrl);
    if (target.origin !== base.origin) return null;
    const basePrefix = base.pathname.replace(/\/+$/, '');
    if (basePrefix && !target.pathname.startsWith(basePrefix)) return null;
    const key = decodeURIComponent(target.pathname.slice(basePrefix.length)).replace(/^\/+/, '');
    if (!key || key.includes('..')) return null;
    return key;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return jsonResponse(corsHeaders, 405, { success: false, error: 'Nem támogatott HTTP metódus.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse(corsHeaders, 500, { success: false, error: 'Szerveroldali Supabase konfiguráció hiányos.' });
  }

  const r2Config = getR2Config();
  if (!r2Config) {
    return jsonResponse(corsHeaders, 503, {
      success: false,
      error: 'A Cloudflare R2 tárhely konfigurációja hiányos a szerveren.',
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return jsonResponse(corsHeaders, 401, { success: false, error: 'Hiányzó hitelesítési token.' });
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse(corsHeaders, 401, { success: false, error: 'Érvénytelen vagy lejárt munkamenet.' });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === 'POST') {
      const form = await req.formData().catch(() => null);
      if (!form) {
        return jsonResponse(corsHeaders, 400, { success: false, error: 'Érvénytelen feltöltési kérelem.' });
      }

      const partnerId = String(form.get('partner_id') || '').trim();
      const rawProductId = String(form.get('product_id') || '').trim();
      const fileEntry = form.get('file');

      if (!UUID_REGEX.test(partnerId)) {
        return jsonResponse(corsHeaders, 400, { success: false, error: 'Érvénytelen partnerazonosító.' });
      }

      const { data: isContact, error: contactErr } = await userClient.rpc('is_partner_contact', {
        target_partner_id: partnerId,
      });
      if (contactErr || !isContact) {
        return jsonResponse(corsHeaders, 403, { success: false, error: 'Nincs jogosultsága ehhez a partnerfiókhoz.' });
      }

      if (!(fileEntry instanceof File)) {
        return jsonResponse(corsHeaders, 400, { success: false, error: 'Hiányzó képfájl.' });
      }
      if (fileEntry.size <= 0 || fileEntry.size > MAX_FILE_SIZE_BYTES) {
        return jsonResponse(corsHeaders, 400, {
          success: false,
          error: 'A képfájl mérete 1 bájt és 5 MB között lehet.',
        });
      }

      const bytes = new Uint8Array(await fileEntry.arrayBuffer());
      const detected = detectImageType(bytes);
      if (!detected) {
        return jsonResponse(corsHeaders, 400, {
          success: false,
          error: 'Csak érvényes JPEG, PNG vagy WebP képfájl tölthető fel.',
        });
      }

      const productSegment = sanitizeProductSegment(rawProductId);
      if (productSegment !== 'draft') {
        const { data: cfg } = await adminClient
          .from('app_configs')
          .select('value')
          .eq('key', '__SYSTEM_CONFIG_MATERIALS_ITEMS__')
          .maybeSingle();

        const list = Array.isArray(cfg?.value) ? cfg.value : [];
        const existing = list.find((item: Record<string, unknown>) => item?.id === productSegment);
        if (existing && String(existing.partner_id || '') !== partnerId) {
          return jsonResponse(corsHeaders, 403, {
            success: false,
            error: 'Más partner termékéhez nem tölthető fel kép.',
          });
        }
      }

      const objectKey = `materials/${partnerId}/${productSegment}/${crypto.randomUUID()}.${detected.ext}`;
      const r2Resp = await signedR2Request(r2Config, 'PUT', objectKey, bytes, detected.mime);

      if (!r2Resp.ok) {
        return jsonResponse(corsHeaders, 502, {
          success: false,
          error: `Cloudflare R2 feltöltési hiba (HTTP ${r2Resp.status}).`,
        });
      }

      return jsonResponse(corsHeaders, 200, {
        success: true,
        url: `${r2Config.publicUrl}/${objectKey}`,
        key: objectKey,
        size: bytes.length,
        mime: detected.mime,
      });
    }

    // DELETE: Remove partner-owned image(s) from R2 if not referenced by another product
    const body = await req.json().catch(() => ({}));
    const partnerId = String(body?.partner_id || '').trim();
    const excludeItemId = typeof body?.exclude_item_id === 'string' ? body.exclude_item_id.trim() : '';
    const urls: string[] = Array.isArray(body?.image_urls)
      ? body.image_urls.filter((u: unknown): u is string => typeof u === 'string')
      : typeof body?.image_url === 'string'
        ? [body.image_url]
        : [];

    if (!UUID_REGEX.test(partnerId)) {
      return jsonResponse(corsHeaders, 400, { success: false, error: 'Érvénytelen partnerazonosító.' });
    }

    const { data: isContact, error: contactErr } = await userClient.rpc('is_partner_contact', {
      target_partner_id: partnerId,
    });
    if (contactErr || !isContact) {
      return jsonResponse(corsHeaders, 403, { success: false, error: 'Nincs jogosultsága ehhez a partnerfiókhoz.' });
    }

    if (urls.length === 0) {
      return jsonResponse(corsHeaders, 200, { success: true, deleted: 0, skipped: 0 });
    }

    const { data: cfg, error: cfgErr } = await adminClient
      .from('app_configs')
      .select('value')
      .eq('key', '__SYSTEM_CONFIG_MATERIALS_ITEMS__')
      .maybeSingle();

    if (cfgErr) {
      return jsonResponse(corsHeaders, 500, {
        success: false,
        error: 'A termékhivatkozások ellenőrzése sikertelen.',
      });
    }

    const list = Array.isArray(cfg?.value) ? (cfg.value as Array<Record<string, unknown>>) : [];

    if (excludeItemId) {
      const excludedItem = list.find((item) => item && item.id === excludeItemId);
      if (!excludedItem) {
        return jsonResponse(corsHeaders, 404, {
          success: false,
          error: 'A megadott termékazonosító nem található.',
        });
      }
      if (String(excludedItem.partner_id || '') !== partnerId) {
        return jsonResponse(corsHeaders, 403, {
          success: false,
          error: 'Más partner termékazonosítója nem használható kizárásra.',
        });
      }
    }

    const referencedKeys = new Set<string>();
    for (const item of list) {
      if (!item || (excludeItemId && item.id === excludeItemId)) continue;
      if (typeof item.main_image_url === 'string') {
        const key = extractR2ObjectKey(item.main_image_url, r2Config.publicUrl);
        if (key) referencedKeys.add(key);
      }
      if (Array.isArray(item.gallery_image_urls)) {
        for (const g of item.gallery_image_urls) {
          if (typeof g === 'string') {
            const key = extractR2ObjectKey(g, r2Config.publicUrl);
            if (key) referencedKeys.add(key);
          }
        }
      }
    }

    const expectedPrefix = `materials/${partnerId}/`;
    let deleted = 0;
    let skipped = 0;

    for (const rawUrl of urls.slice(0, 20)) {
      const key = extractR2ObjectKey(rawUrl, r2Config.publicUrl);
      if (!key || !key.startsWith(expectedPrefix)) {
        skipped++;
        continue;
      }
      if (referencedKeys.has(key)) {
        skipped++;
        continue;
      }
      const delResp = await signedR2Request(r2Config, 'DELETE', key);
      if (delResp.ok || delResp.status === 404) {
        deleted++;
      }
    }

    return jsonResponse(corsHeaders, 200, { success: true, deleted, skipped });
  } catch (err: unknown) {
    return jsonResponse(corsHeaders, 500, {
      success: false,
      error: err instanceof Error ? err.message : 'Váratlan szerverhiba történt.',
    });
  }
});
