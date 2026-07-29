const HUNGARIAN_ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'Á': 'a',
  'é': 'e', 'É': 'e',
  'í': 'i', 'Í': 'i',
  'ó': 'o', 'Ó': 'o',
  'ö': 'o', 'Ö': 'o',
  'ő': 'o', 'Ő': 'o',
  'ú': 'u', 'Ú': 'u',
  'ü': 'u', 'Ü': 'u',
  'ű': 'u', 'Ű': 'u',
};

export function slugify(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .split('')
    .map((char) => HUNGARIAN_ACCENT_MAP[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
