import { supabase } from '../lib/supabase';

export interface PartnerReferenceImage {
  id: string;
  reference_id: string;
  partner_id: string;
  object_key: string;
  thumbnail_key: string;
  caption?: string | null;
  display_order: number;
  is_cover: boolean;
  width: number;
  height: number;
  size_bytes: number;
  created_at?: string;
  url?: string;
}

export interface PartnerReference {
  id: string;
  partner_id: string;
  title: string;
  location?: string | null;
  year?: string | null;
  category?: string | null;
  description?: string | null;
  website_url?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  images: PartnerReferenceImage[];
  cover_image?: PartnerReferenceImage | null;
}

export interface CreateReferencePayload {
  title: string;
  location?: string | null;
  year?: string | null;
  category?: string | null;
  description?: string | null;
  website_url?: string | null;
  is_published?: boolean;
}

export interface UpdateReferencePayload {
  title?: string;
  location?: string | null;
  year?: string | null;
  category?: string | null;
  description?: string | null;
  website_url?: string | null;
  is_published?: boolean;
}

export interface ReferenceInputItem {
  id?: string;
  title: string;
  location?: string | null;
  year?: string | null;
  category?: string | null;
  description?: string | null;
  website_url?: string | null;
  is_published?: boolean;
  image_url?: string;
  images?: string[];
  display_order?: number;
}

/**
 * Feloldja a kép végső megjelenítési URL-jét objektumkulcs vagy külső/adat-URL alapján.
 */
export function resolveReferenceImageUrl(
  imageOrKey: PartnerReferenceImage | string | null | undefined
): string {
  if (!imageOrKey) return '';
  let keyOrUrl = '';
  if (typeof imageOrKey === 'string') {
    keyOrUrl = imageOrKey;
  } else if (imageOrKey.url) {
    keyOrUrl = imageOrKey.url;
  } else if (imageOrKey.object_key) {
    keyOrUrl = imageOrKey.object_key;
  } else if (imageOrKey.thumbnail_key) {
    keyOrUrl = imageOrKey.thumbnail_key;
  }

  if (!keyOrUrl) return '';

  // Belső hash és a nem létező /thumbs/ almappa feloldása a valódi képre
  const cleanKey = keyOrUrl.split('#')[0].trim().replace('/thumbs/', '/');

  if (
    cleanKey.startsWith('http://') ||
    cleanKey.startsWith('https://') ||
    cleanKey.startsWith('data:')
  ) {
    return cleanKey;
  }

  // Ha már tartalmazza a vödör nevét
  if (cleanKey.startsWith('partner-references/')) {
    return `https://olmavxcmkvvcebgqxohe.supabase.co/storage/v1/object/public/${cleanKey}`;
  }

  return `https://olmavxcmkvvcebgqxohe.supabase.co/storage/v1/object/public/partner-references/${cleanKey}`;
}

/**
 * Segédfüggvény a tárolókulcs normalizálásához összehasonlításokhoz.
 */
function extractStorageKey(urlOrKey: string): string {
  if (!urlOrKey) return '';
  const clean = urlOrKey.split('#')[0].trim().replace('/thumbs/', '/');
  const prefix = 'https://olmavxcmkvvcebgqxohe.supabase.co/storage/v1/object/public/partner-references/';
  if (clean.startsWith(prefix)) {
    return clean.slice(prefix.length);
  }
  return clean;
}

/**
 * Helyi tárolóból származó partner referenciák beolvasása (biztonsági fallback mód).
 */
function getLocalFallbackReferences(partnerId: string, onlyPublished: boolean): PartnerReference[] {
  if (typeof localStorage === 'undefined' || !partnerId) return [];
  try {
    const raw = localStorage.getItem('epitotudas_partners_v2');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    interface LocalRefItem {
      id?: string;
      is_published?: boolean;
      image_url?: string;
      images?: string[];
      title?: string;
      location?: string;
      year?: string;
      category?: string;
      description?: string;
      website_url?: string;
      created_at?: string;
      updated_at?: string;
    }
    interface LocalPartnerItem {
      id?: string;
      slug?: string;
      references?: LocalRefItem[];
    }
    const p = (list as LocalPartnerItem[]).find((item) => item && (item.id === partnerId || item.slug === partnerId));
    if (!p || !Array.isArray(p.references)) return [];

    return p.references
      .filter((r) => r && (!onlyPublished || r.is_published !== false))
      .map((r, idx: number) => {
        const rawImgs: string[] = [
          ...(r.image_url ? [r.image_url] : []),
          ...((r.images || []).filter((u: string) => u !== r.image_url)),
        ];
        const images: PartnerReferenceImage[] = rawImgs.map((url: string, iIdx: number) => ({
          id: `img-${r.id || idx}-${iIdx}`,
          reference_id: r.id || `ref-${idx}`,
          partner_id: partnerId,
          object_key: url,
          thumbnail_key: url,
          caption: null,
          display_order: iIdx + 1,
          is_cover: iIdx === 0,
          width: 1600,
          height: 1067,
          size_bytes: 100000,
          url,
        }));
        return {
          id: r.id || `ref-${idx}`,
          partner_id: partnerId,
          title: r.title || 'Referencia',
          location: r.location || null,
          year: r.year || null,
          category: r.category || null,
          description: r.description || null,
          website_url: r.website_url || null,
          is_published: r.is_published !== false,
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString(),
          images,
          cover_image: images[0] || null,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Lekéri egy partner összes referenciáját a hozzájuk tartozó képekkel a Supabase-ből.
 * Publikus nézetben (onlyPublished = true) kizárólag a jóváhagyott, publikált munkák jelennek meg.
 */
export async function getPartnerReferences(
  partnerId: string,
  onlyPublished = true
): Promise<PartnerReference[]> {
  if (!partnerId) return [];

  try {
    let query = supabase
      .from('partner_references')
      .select(`
        id,
        partner_id,
        title,
        location,
        year,
        category,
        description,
        website_url,
        is_published,
        created_at,
        updated_at,
        partner_reference_images (
          id,
          reference_id,
          partner_id,
          object_key,
          thumbnail_key,
          caption,
          display_order,
          is_cover,
          width,
          height,
          size_bytes,
          created_at
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (onlyPublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return getLocalFallbackReferences(partnerId, onlyPublished);
    }

    type RawReferenceRow = Omit<PartnerReference, 'images'> & { partner_reference_images?: PartnerReferenceImage[] };
    return (data as RawReferenceRow[]).map((raw) => {
      let rawImages: PartnerReferenceImage[] = Array.isArray(raw.partner_reference_images)
        ? [...raw.partner_reference_images].sort((a, b) => a.display_order - b.display_order)
        : [];

      // Kiegészítés a helyi adatokból, ha a relációs képtáblában még nincsenek sorok
      if (rawImages.length === 0) {
        const localList = getLocalFallbackReferences(partnerId, false);
        const match = localList.find((lr) => lr.id === raw.id || lr.title === raw.title);
        if (match && match.images && match.images.length > 0) {
          rawImages = match.images;
        }
      }

      const cover = rawImages.find((img) => img.is_cover) || rawImages[0] || null;

      return {
        id: raw.id,
        partner_id: raw.partner_id,
        title: raw.title,
        location: raw.location,
        year: raw.year,
        category: raw.category,
        description: raw.description,
        website_url: raw.website_url,
        is_published: raw.is_published,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        images: rawImages,
        cover_image: cover,
      };
    });
  } catch (err) {
    console.warn('Kivétel a referenciák lekérdezésekor:', err);
    return getLocalFallbackReferences(partnerId, onlyPublished);
  }
}

/**
 * Új referencia létrehozása a Supabase partner_references táblájában.
 */
export async function createReference(
  partnerId: string,
  payload: CreateReferencePayload
): Promise<PartnerReference> {
  const { data, error } = await supabase
    .from('partner_references')
    .insert({
      partner_id: partnerId,
      title: payload.title.trim(),
      location: payload.location?.trim() || null,
      year: payload.year?.trim() || null,
      category: payload.category?.trim() || null,
      description: payload.description?.trim() || null,
      website_url: payload.website_url?.trim() || null,
      is_published: payload.is_published ?? false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Referencia létrehozása sikertelen: ${error.message}`);
  }

  return {
    ...data,
    images: [],
    cover_image: null,
  };
}

/**
 * Meglévő referencia adatainak frissítése a Supabase-ben.
 */
export async function updateReference(
  referenceId: string,
  payload: UpdateReferencePayload
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.location !== undefined) updateData.location = payload.location?.trim() || null;
  if (payload.year !== undefined) updateData.year = payload.year?.trim() || null;
  if (payload.category !== undefined) updateData.category = payload.category?.trim() || null;
  if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
  if (payload.website_url !== undefined) updateData.website_url = payload.website_url?.trim() || null;
  if (payload.is_published !== undefined) updateData.is_published = payload.is_published;
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('partner_references')
    .update(updateData)
    .eq('id', referenceId);

  if (error) {
    throw new Error(`Referencia frissítése sikertelen: ${error.message}`);
  }
}

/**
 * Referencia törlése a Supabase-ből (kaszkádolt törléssel).
 */
export async function deleteReference(referenceId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_references')
    .delete()
    .eq('id', referenceId);

  if (error) {
    throw new Error(`Referencia törlése sikertelen: ${error.message}`);
  }
}

/**
 * Partneri vagy adminisztrátori publikálási RPC meghívása.
 */
export async function publishPartnerReference(referenceId: string): Promise<boolean> {
  if (!referenceId) return false;
  try {
    const { data, error } = await supabase.rpc('publish_partner_reference', {
      p_reference_id: referenceId,
    });
    if (!error) return !!data;

    console.warn('Figyelmeztetés a referencia publikálásakor:', error.message);
    return false;
  } catch (err) {
    console.warn('Kivétel a referencia publikálásakor:', err);
    return false;
  }
}

/**
 * Borítókép kijelölése a meglévő set_reference_cover_image RPC segítségével.
 */
export async function setReferenceCoverImage(
  referenceId: string,
  imageId: string
): Promise<boolean> {
  if (!referenceId || !imageId) return false;
  try {
    const { data, error } = await supabase.rpc('set_reference_cover_image', {
      p_reference_id: referenceId,
      p_image_id: imageId,
    });
    if (!error) return !!data;
    console.warn('Borítókép kijelölési figyelmeztetés:', error.message);
    return false;
  } catch (err) {
    console.warn('Borítókép kijelölési kivétel:', err);
    return false;
  }
}

/**
 * Feltöltési szándék (Upload Intent) létrehozása a Supabase-ben.
 */
export async function createUploadIntent(
  partnerId: string,
  referenceId: string,
  expectedSizeBytes: number,
  expectedMimeType: string
): Promise<{ intentId: string; stagingKey: string; allocatedObjectKey: string }> {
  const { data, error } = await supabase.rpc('create_reference_upload_intent', {
    p_partner_id: partnerId,
    p_reference_id: referenceId,
    p_expected_size_bytes: expectedSizeBytes,
    p_expected_mime_type: expectedMimeType,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    throw new Error(`Feltöltési szándék elutasítva: ${error?.message || 'Üres válasz'}`);
  }

  const res = Array.isArray(data) ? data[0] : data;
  return {
    intentId: res.intent_id,
    stagingKey: res.staging_key,
    allocatedObjectKey: res.allocated_object_key || res.staging_key,
  };
}

/**
 * Fájl feltöltése a Supabase Storage partner-references tárolójába.
 */
export async function uploadReferenceFile(
  targetKey: string,
  fileOrBlob: Blob | File
): Promise<void> {
  const safeMime = ['image/jpeg', 'image/png', 'image/webp'].includes(fileOrBlob.type)
    ? fileOrBlob.type
    : 'image/jpeg';

  const { error } = await supabase.storage
    .from('partner-references')
    .upload(targetKey, fileOrBlob, {
      contentType: safeMime,
      upsert: false,
    });

  if (error) {
    throw new Error(`Tárhely fájlfeltöltés sikertelen: ${error.message}`);
  }
}

/**
 * Kép megerősítése és véglegesítése a szerveroldali finalize_reference_image RPC segítségével.
 */
export async function finalizeReferenceImageRPC(
  intentId: string,
  caption?: string | null,
  isCover?: boolean,
  sizeBytes?: number
): Promise<{ imageId: string; objectKey: string; publicUrl: string }> {
  const { data, error } = await supabase.rpc('finalize_reference_image', {
    p_intent_id: intentId,
    p_caption: caption || null,
    p_width: 1600,
    p_height: 1067,
    p_size_bytes: sizeBytes || 0,
    p_is_cover: isCover || false,
  });

  if (error) {
    throw new Error(`Kép véglegesítési hiba: ${error.message}`);
  }

  const res = Array.isArray(data) ? data[0] : data;
  if (!res || !res.success) {
    throw new Error(`Kép véglegesítés elutasítva: ${res?.error_code || 'Ismeretlen hiba'}`);
  }

  const objectKey = res.permanent_object_key;
  const publicUrl = resolveReferenceImageUrl(objectKey);

  return {
    imageId: res.image_id,
    objectKey,
    publicUrl,
  };
}

/**
 * Data URL, HTTP(S) URL vagy Fájl feltöltése a biztonságos intent-alapú láncon keresztül (PostgreSQL RPC).
 */
export async function uploadReferenceImageThroughIntent(
  partnerId: string,
  referenceId: string,
  dataUrlOrFileOrHttp: string | File,
  isCover = false,
  caption?: string | null
): Promise<{ imageId: string; objectKey: string; publicUrl: string }> {
  let blob: Blob;
  let mime = 'image/jpeg';

  if (typeof dataUrlOrFileOrHttp === 'string') {
    if (dataUrlOrFileOrHttp.startsWith('data:')) {
      const parts = dataUrlOrFileOrHttp.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const binary = atob(parts[1]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      blob = new Blob([array], { type: mime });
    } else if (dataUrlOrFileOrHttp.startsWith('http://') || dataUrlOrFileOrHttp.startsWith('https://')) {
      try {
        const resp = await fetch(dataUrlOrFileOrHttp);
        blob = await resp.blob();
        mime = blob.type || 'image/jpeg';
      } catch {
        blob = new Blob([new Uint8Array(100)], { type: 'image/jpeg' });
      }
    } else {
      // Ismeretlen kulcs
      return { imageId: '', objectKey: dataUrlOrFileOrHttp, publicUrl: dataUrlOrFileOrHttp };
    }
  } else {
    blob = dataUrlOrFileOrHttp;
    mime = dataUrlOrFileOrHttp.type || 'image/jpeg';
  }

  // Támogatott mime biztosítása
  const safeMime = ['image/jpeg', 'image/png', 'image/webp'].includes(mime) ? mime : 'image/jpeg';

  // 1. Lépés: Intent létrehozása
  const { intentId, stagingKey, allocatedObjectKey } = await createUploadIntent(
    partnerId,
    referenceId,
    Math.max(1, blob.size),
    safeMime
  );

  // 2. Lépés: Fájl feltöltése a tárhelyre
  const targetKey = allocatedObjectKey || stagingKey;
  await uploadReferenceFile(targetKey, blob);

  // 3. Lépés: Véglegesítés az RPC segítségével
  return await finalizeReferenceImageRPC(intentId, caption, isCover, blob.size);
}

/**
 * Szinkronizálja egy referencia képeit:
 * - Közvetlenül a `partner-references` Storage bucketbe és a `finalize_reference_image` RPC segítségével rögzíti az új képeket.
 * - Törli a felületről eltávolított képeket.
 * - Rögzíti a kijelölt borítóképet.
 */
export async function syncReferenceImages(
  referenceId: string,
  partnerId: string,
  imageUrls: string[]
): Promise<void> {
  if (!referenceId || !partnerId) return;

  try {
    // 1. Meglévő képek lekérdezése
    const { data: existingImages } = await supabase
      .from('partner_reference_images')
      .select('id, object_key, thumbnail_key, display_order, is_cover')
      .eq('reference_id', referenceId)
      .order('display_order', { ascending: true });

    const existing = existingImages || [];
    const validUrls = (imageUrls || [])
      .filter((url) => typeof url === 'string' && url.trim().length > 0)
      .slice(0, 10);

    // 2. Törölt képek eltávolítása az adatbázisból
    for (const exImg of existing) {
      const cleanKey = extractStorageKey(exImg.object_key || '');
      const isRetained = validUrls.some((u) => extractStorageKey(u) === cleanKey);
      if (!isRetained) {
        try {
          await supabase
            .from('partner_reference_images')
            .delete()
            .eq('id', exImg.id);
        } catch {
          // csendes elnyelés
        }
      }
    }

    let firstCreatedImageId: string | null = null;

    // 3. Új képek feltöltése a biztonságos intent pipeline-on keresztül
    for (let i = 0; i < validUrls.length; i++) {
      const rawUrl = validUrls[i].trim();
      const isCover = i === 0;

      const normKey = extractStorageKey(rawUrl);
      const isAlreadyInDb = existing.some(
        (img) => extractStorageKey(img.object_key || '') === normKey
      );

      // Ha már az adatbázisban van vagy meglévő Supabase tároló URL, nem kell újra feltölteni
      if (isAlreadyInDb || rawUrl.includes('/storage/v1/object/public/partner-references/')) {
        continue;
      }

      try {
        const uploaded = await uploadReferenceImageThroughIntent(
          partnerId,
          referenceId,
          rawUrl,
          isCover
        );
        if (uploaded.imageId && !firstCreatedImageId) {
          firstCreatedImageId = uploaded.imageId;
        }
      } catch (uploadErr) {
        console.warn('Figyelmeztetés a kép intent-alapú feltöltésekor:', uploadErr);
      }
    }

    // 4. Borítókép kijelölése a set_reference_cover_image RPC segítségével
    if (firstCreatedImageId) {
      await setReferenceCoverImage(referenceId, firstCreatedImageId);
    } else if (existing.length > 0 && !existing.some((img) => img.is_cover)) {
      await setReferenceCoverImage(referenceId, existing[0].id);
    }
  } catch (err) {
    console.warn('Kivétel a referencia képek szinkronizálásakor:', err);
  }
}

/**
 * Egyetlen referencia adatainak és képeinek elmentése, majd szabályos publikálása.
 */
export async function savePartnerReference(
  partnerId: string,
  ref: ReferenceInputItem
): Promise<string> {
  if (!partnerId) throw new Error('Partnerazonosító hiányzik a referencia mentéséhez.');
  const isUuid = !!ref.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref.id);

  let targetId = ref.id;

  if (isUuid && targetId) {
    // Frissítés
    await updateReference(targetId, {
      title: ref.title,
      location: ref.location,
      year: ref.year,
      category: ref.category,
      description: ref.description,
      website_url: ref.website_url,
      is_published: ref.is_published,
    });
  } else {
    // Létrehozás (alapértelmezetten piszkozatként jön létre a trigger szerint)
    const created = await createReference(partnerId, {
      title: ref.title || 'Új Referencia',
      location: ref.location,
      year: ref.year,
      category: ref.category,
      description: ref.description,
      website_url: ref.website_url,
      is_published: false,
    });
    targetId = created.id;
  }

  // Képek szinkronizálása a relációs táblával
  const allImages: string[] = [
    ...(ref.image_url ? [ref.image_url] : []),
    ...((ref.images || []).filter((u) => u !== ref.image_url)),
  ];

  if (targetId && allImages.length > 0) {
    await syncReferenceImages(targetId, partnerId, allImages);
  }

  // Szabályos publikálás a partner jogosultságával
  if (targetId && ref.is_published !== false) {
    await publishPartnerReference(targetId);
  }

  return targetId!;
}

/**
 * Szinkronizálja a partner összes referenciáját az adatbázissal.
 */
export async function syncPartnerReferences(
  partnerId: string,
  currentItems: ReferenceInputItem[],
  originalIds: string[]
): Promise<PartnerReference[]> {
  if (!partnerId) return [];

  const isPartnerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId);
  if (!isPartnerUuid) {
    console.warn('Nem UUID partnerazonosító, a táblaszinkronizáció kihagyásra kerül.');
    return [];
  }

  // 1. Törölt referenciák eltávolítása a DB-ből
  const currentUuidSet = new Set(
    currentItems
      .filter((item) => item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id))
      .map((item) => item.id as string)
  );

  for (const origId of originalIds || []) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(origId) && !currentUuidSet.has(origId)) {
      try {
        await deleteReference(origId);
      } catch (delErr) {
        console.warn(`Hiba a ${origId} azonosítójú referencia törlésekor:`, delErr);
      }
    }
  }

  // 2. Referenciák és képeik mentése
  for (const item of currentItems) {
    if (!item.title || !item.title.trim()) continue;
    try {
      await savePartnerReference(partnerId, item);
    } catch (saveErr) {
      console.warn('Hiba a referencia mentésekor:', saveErr);
    }
  }

  // 3. Visszaolvasás a Supabase-ből
  return await getPartnerReferences(partnerId, false);
}
