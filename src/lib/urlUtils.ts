export interface SanitizeExternalUrlOptions {
  /** Prepend `https://` when the value has no URL scheme (e.g. `example.com`). */
  allowAutoHttps?: boolean;
  /** Allow same-origin relative paths starting with a single `/`. */
  allowRelative?: boolean;
}

/**
 * Validates and normalizes an external URL so dangerous schemes like
 * `javascript:`, `data:`, or `vbscript:` can never be rendered in `href`.
 */
export function sanitizeExternalUrl(
  rawUrl?: string | null,
  options: SanitizeExternalUrlOptions = {}
): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  // Reject ASCII control characters / obfuscated scheme payloads
  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return undefined;
  }

  if (options.allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  if (
    options.allowAutoHttps &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) &&
    !trimmed.startsWith('//')
  ) {
    const candidate = `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'https:' && parsed.hostname.includes('.')) {
        return candidate;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}
