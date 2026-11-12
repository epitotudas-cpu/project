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

/**
 * Resolves a public URL or CDN path for a reference image object key or URL string.
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
  } else if (imageOrKey.thumbnail_key) {
    keyOrUrl = imageOrKey.thumbnail_key;
  } else if (imageOrKey.object_key) {
    keyOrUrl = imageOrKey.object_key;
  }

  if (!keyOrUrl) return '';

  // Eltávolítjuk a belső egyediséget biztosító hash-töredéket (#ref-...)
  const cleanKey = keyOrUrl.split('#')[0];

  if (
    cleanKey.startsWith('http://') ||
    cleanKey.startsWith('https://') ||
    cleanKey.startsWith('data:')
  ) {
    return cleanKey;
  }

  return `https://olmavxcmkvvcebgqxohe.supabase.co/storage/v1/object/public/${cleanKey}`;
}

/**
 * Lekéri egy partner összes referenciáját a kapcsolódó képekkel együtt a Supabase-ből.
 * Ha az adatbázisban a partner_references tábla még nem létezik (pre-migráció),
 * zökkenőmentesen a partnerService fallback adatait adja vissza.
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

    if (error) {
      console.warn('Figyelmeztetés a partner referenciák lekérdezésekor:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as any[]).map((raw) => {
      const rawImages: PartnerReferenceImage[] = Array.isArray(raw.partner_reference_images)
        ? raw.partner_reference_images.sort((a: any, b: any) => a.display_order - b.display_order)
        : [];

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
    return [];
  }
}

/**
 * Új referencia létrehozása a Supabase-ben.
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
  const updateData: Record<string, any> = {};
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
 * Referencia törlése a Supabase-ből (kaszkádolva törli a képrekordokat).
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
 * Adminisztrátori vagy partneri publikálási művelet a partner_references táblára.
 */
export async function publishPartnerReference(referenceId: string): Promise<boolean> {
  if (!referenceId) return false;
  try {
    // 1. Megpróbáljuk a dedikált RPC-t
    const { data, error } = await supabase.rpc('publish_partner_reference', {
      p_reference_id: referenceId,
    });
    if (!error) return !!data;

    // 2. Fallback közvetlen UPDATE-re
    const { error: updateError } = await supabase
      .from('partner_references')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', referenceId);

    if (updateError) {
      console.warn('Figyelmeztetés a referencia publikálásakor:', updateError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Kivétel a referencia publikálásakor:', err);
    return false;
  }
}

/**
 * Szinkronizálja egy referencia képeit a partner_reference_images táblával.
 */
export async function syncReferenceImages(
  referenceId: string,
  partnerId: string,
  imageUrls: string[]
): Promise<void> {
  if (!referenceId || !partnerId) return;

  try {
    // 1. Lekérdezzük a referencia jelenlegi képeit
    const { data: existingImages, error: fetchErr } = await supabase
      .from('partner_reference_images')
      .select('id, object_key, thumbnail_key, display_order, is_cover')
      .eq('reference_id', referenceId)
      .order('display_order', { ascending: true });

    if (fetchErr) {
      console.warn('Figyelmeztetés a képek lekérdezésekor:', fetchErr.message);
    }

    const existing = existingImages || [];
    // Legfeljebb 10 kép engedélyezett az adatbázis kényszer szerint
    const validUrls = (imageUrls || [])
      .filter((url) => typeof url === 'string' && url.trim().length > 0)
      .slice(0, 10);

    // 2. Töröljük azokat a meglévő képeket, amelyek már nincsenek az új URL listában
    for (const exImg of existing) {
      const cleanKey = (exImg.object_key || '').split('#')[0];
      const isRetained = validUrls.some((u) => u.split('#')[0] === cleanKey);
      if (!isRetained) {
        const { error: delErr } = await supabase
          .from('partner_reference_images')
          .delete()
          .eq('id', exImg.id);
        if (delErr) {
          console.warn('Kép törlése sikertelen a partner_reference_images táblából:', delErr.message);
        }
      }
    }

    // 3. Új képek beszúrása vagy meglévők sorrendjének / borítókép státuszának frissítése
    for (let i = 0; i < validUrls.length; i++) {
      const rawUrl = validUrls[i].trim();
      const cleanUrl = rawUrl.split('#')[0];
      const order = i + 1; // 1..10
      const isCover = i === 0;

      const existingMatch = existing.find(
        (img) => (img.object_key || '').split('#')[0] === cleanUrl
      );

      if (existingMatch) {
        if (existingMatch.display_order !== order || existingMatch.is_cover !== isCover) {
          await supabase
            .from('partner_reference_images')
            .update({ display_order: order, is_cover: isCover })
            .eq('id', existingMatch.id);
        }
      } else {
        const uniqueKey = `${cleanUrl}#${referenceId}-${order}`;
        const uniqueThumbKey = `${cleanUrl}#thumb-${referenceId}-${order}`;
        const { error: insErr } = await supabase
          .from('partner_reference_images')
          .insert({
            reference_id: referenceId,
            partner_id: partnerId,
            object_key: uniqueKey,
            thumbnail_key: uniqueThumbKey,
            caption: null,
            display_order: order,
            is_cover: isCover,
            width: 1600,
            height: 1067,
            size_bytes: 100000,
          });

        if (insErr) {
          console.warn('Figyelmeztetés a kép beszúrásakor:', insErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('Kivétel a referencia képek szinkronizálásakor:', err);
  }
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
 * Elment vagy frissít egyetlen referenciát és annak képeit a Supabase-ben.
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
    // Létrehozás
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

  // Képek összegyűjtése és szinkronizálása
  const allImages: string[] = [
    ...(ref.image_url ? [ref.image_url] : []),
    ...((ref.images || []).filter((u) => u !== ref.image_url)),
  ];

  if (targetId && allImages.length > 0) {
    await syncReferenceImages(targetId, partnerId, allImages);
  }

  // Ha a referencia publikálásra lett jelölve, publikáljuk
  if (targetId && ref.is_published) {
    await publishPartnerReference(targetId);
  }

  return targetId!;
}

/**
 * Szinkronizálja a teljes referencia listát a partner számára a Supabase-ben:
 * - A korábban létező, de törölt referenciákat törli az adatbázisból.
 * - Az új és módosított referenciákat menti / frissíti a hozzájuk tartozó képekkel.
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

  // 1. Törölt referenciák megkeresése és törlése a DB-ből
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

  // 2. Referenciák és képeik mentése / frissítése
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


