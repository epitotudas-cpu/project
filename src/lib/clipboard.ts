/**
 * Copy text to clipboard safely without throwing unhandled promise rejections.
 * Returns true when copying succeeded, false otherwise.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.warn('Vágólapra másolás sikertelen:', err);
    return false;
  }
}

