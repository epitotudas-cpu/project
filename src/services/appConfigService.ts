import { supabase } from '../lib/supabase';

/**
 * Reads a system configuration JSON value from `app_configs`, falling back to
 * the legacy `categories` row (`__SYSTEM_CONFIG_*__`) if `app_configs` is not yet
 * populated or the migration has not been applied.
 */
export async function readAppConfig<T>(key: string, legacyCategoryId?: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!error && data?.value !== undefined && data?.value !== null) {
      return data.value as T;
    }
  } catch {
    // Fallback to legacy categories table below
  }

  if (!legacyCategoryId) return null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', legacyCategoryId)
      .maybeSingle();

    if (!error && data?.description) {
      return JSON.parse(data.description) as T;
    }
  } catch {
    // Ignore malformed JSON or missing legacy row
  }

  return null;
}

/**
 * Writes a system configuration JSON value to `app_configs`, and falls back to
 * updating the legacy `categories` row if `app_configs` is unavailable.
 */
export async function writeAppConfig<T>(
  key: string,
  value: T,
  legacyCategory?: { id: string; slug: string }
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('app_configs')
    .upsert({ key, value: value as unknown as Record<string, unknown>, updated_at: now });

  if (!error) return;

  if (legacyCategory) {
    const { error: legacyErr } = await supabase.from('categories').upsert({
      id: legacyCategory.id,
      name: key,
      slug: legacyCategory.slug,
      description: JSON.stringify(value),
      article_count: 0,
      created_at: now,
      updated_at: now,
    } as Record<string, unknown>);
    if (legacyErr) {
      throw new Error(legacyErr.message || 'Konfiguráció mentése sikertelen.');
    }
  } else {
    throw new Error(error.message || 'Konfiguráció mentése sikertelen.');
  }
}

