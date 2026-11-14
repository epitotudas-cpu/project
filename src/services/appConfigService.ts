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

/**
 * Reads an app_configs entry along with its `updated_at` version token
 * for optimistic concurrency (CAS) updates.
 */
export async function readAppConfigWithVersion<T>(
  key: string,
  legacyCategoryId?: string
): Promise<{ value: T | null; updatedAt: string | null }> {
  try {
    const { data, error } = await supabase
      .from('app_configs')
      .select('value, updated_at')
      .eq('key', key)
      .maybeSingle();

    if (!error && data?.value !== undefined && data?.value !== null) {
      return {
        value: data.value as T,
        updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
      };
    }
  } catch {
    // Fallback to legacy readAppConfig below
  }

  const fallbackValue = await readAppConfig<T>(key, legacyCategoryId);
  return { value: fallbackValue, updatedAt: null };
}

/**
 * Performs an optimistic compare-and-swap (CAS) write on `app_configs`.
 * Returns `{ conflict: true }` when another writer modified or inserted the key
 * since `expectedUpdatedAt` was read, allowing callers to re-fetch, merge, and retry.
 */
export async function writeAppConfigIfUnchanged<T>(
  key: string,
  value: T,
  expectedUpdatedAt: string | null,
  legacyCategory?: { id: string; slug: string }
): Promise<{ conflict: boolean; updatedAt: string | null }> {
  const now = new Date().toISOString();

  if (expectedUpdatedAt !== null) {
    const { data, error } = await supabase
      .from('app_configs')
      .update({ value: value as unknown as Record<string, unknown>, updated_at: now })
      .eq('key', key)
      .eq('updated_at', expectedUpdatedAt)
      .select('updated_at');

    if (!error) {
      if (!Array.isArray(data) || data.length === 0) {
        return { conflict: true, updatedAt: null };
      }
      return {
        conflict: false,
        updatedAt: typeof data[0]?.updated_at === 'string' ? data[0].updated_at : now,
      };
    }
  } else {
    const { data, error } = await supabase
      .from('app_configs')
      .insert({ key, value: value as unknown as Record<string, unknown>, updated_at: now })
      .select('updated_at');

    if (!error) {
      return {
        conflict: false,
        updatedAt: Array.isArray(data) && typeof data[0]?.updated_at === 'string' ? data[0].updated_at : now,
      };
    }

    if (error.code === '23505') {
      return { conflict: true, updatedAt: null };
    }
  }

  await writeAppConfig(key, value, legacyCategory);
  return { conflict: false, updatedAt: now };
}

