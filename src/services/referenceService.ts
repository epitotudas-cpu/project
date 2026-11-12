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
  if (typeof imageOrKey === 'string') {
    if (imageOrKey.startsWith('http://') || imageOrKey.startsWith('https://')) {
      return imageOrKey;
    }
    // Ha relatív kulcs, a jövőbeli R2 CDN vagy Supabase storage útvonalra képezzük le
    return `https://olmavxcmkvvcebgqxohe.supabase.co/storage/v1/object/public/${imageOrKey}`;
  }
  if (imageOrKey.url) return imageOrKey.url;
  if (imageOrKey.thumbnail_key) {
    return resolveReferenceImageUrl(imageOrKey.thumbnail_key);
  }
  if (imageOrKey.object_key) {
    return resolveReferenceImageUrl(imageOrKey.object_key);
  }
  return '';
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

