import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfCoverResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  generatedAt?: string;
  sourceUrl?: string;
}

/**
 * Normalizes cloud storage URLs (Google Drive, Dropbox) AND encodes non-ASCII characters (e.g. Hungarian accents ö, ő, á, é, í, ó, ú, ü, ű).
 */
export function normalizePdfUrl(urlStr: string): string {
  if (!urlStr) return '';
  let url = urlStr.trim();

  // Convert Google Drive view URL to direct download URL
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
  if (driveMatch && driveMatch[1]) {
    url = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }

  // Convert Dropbox share URL dl=0 to dl=1
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    url = url.replace('dl=0', 'dl=1');
  }

  // Safely encode non-ASCII characters in URL paths (e.g. Wienerberger tetőfedő kisokos)
  try {
    url = encodeURI(decodeURI(url));
  } catch {}

  return url;
}

/**
 * Validates protocol, hostname, and SSRF restrictions on target URL.
 */
export function isValidPdfUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!urlStr || !urlStr.trim()) {
    return { valid: false, error: 'Az előnézeti / letöltési URL nem érvényes.' };
  }

  const normalized = normalizePdfUrl(urlStr);

  if (!/^https?:\/\//i.test(normalized)) {
    return { valid: false, error: 'Az előnézeti / letöltési URL nem érvényes.' };
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    // SSRF & Local IP Blocking
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return { valid: false, error: 'Az URL biztonsági okokból nem dolgozható fel.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Az előnézeti / letöltési URL nem érvényes.' };
  }
}

/**
 * Multi-stage fetch for PDF ArrayBuffer with CORS proxy fallbacks.
 */
async function fetchPdfArrayBuffer(normalizedUrl: string): Promise<ArrayBuffer | null> {
  // Strategy 1: Direct fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/pdf,application/octet-stream,*/*' },
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0 && buffer.byteLength <= 45000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('Direct PDF fetch failed (likely CORS restriction), trying proxies...', e);
  }

  // Strategy 2: CORS Proxy (corsproxy.io)
  try {
    const proxy1 = `https://corsproxy.io/?${normalizedUrl}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(proxy1, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0 && buffer.byteLength <= 45000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('Proxy 1 fetch failed, trying proxy 2...', e);
  }

  // Strategy 3: CORS Proxy (allorigins)
  try {
    const proxy2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(proxy2, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0 && buffer.byteLength <= 45000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('Proxy 2 fetch failed...', e);
  }

  return null;
}

/**
 * Renders an Image URL (or wsrv PDF page 1 URL) onto a 2:3 ratio Canvas and returns DataURL.
 */
async function tryRenderAsImage(urlStr: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeoutId = setTimeout(() => {
      img.src = '';
      resolve(null);
    }, 15000);

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 900);

        const scale = Math.min(600 / img.width, 900 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (600 - w) / 2;
        const y = (900 - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(null);
    };

    img.src = urlStr;
  });
}

/**
 * Renders Page 1 of target PDF using High-Performance Cloudflare renderer (wsrv)
 * with fallback to local pdfjs-dist and direct Image rendering.
 */
export async function generateCoverFromPdfUrl(urlStr: string): Promise<PdfCoverResult> {
  // 1. URL validation
  const validation = isValidPdfUrl(urlStr);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Az előnézeti / letöltési URL nem érvényes.',
    };
  }

  const cleanUrl = urlStr.trim();
  const normalizedUrl = normalizePdfUrl(cleanUrl);

  try {
    // 2. High-Performance Strategy 1: Cloudflare-powered PDF Page 1 renderer (wsrv.nl)
    // Renders Page 1 (page=0 in 0-indexed libvips) of target PDF into a 600x900 image with full CORS support
    const wsrvPdfPage1Url = `https://wsrv.nl/?url=${encodeURIComponent(normalizedUrl)}&page=0&w=600&h=900&fit=contain&output=jpg&q=88`;
    const cloudCover = await tryRenderAsImage(wsrvPdfPage1Url);

    if (cloudCover) {
      return {
        success: true,
        imageUrl: cloudCover,
        generatedAt: new Date().toISOString(),
        sourceUrl: cleanUrl,
      };
    }

    // 3. Strategy 2: Local pdfjs-dist via direct fetch / CORS proxies ArrayBuffer
    const arrayBuffer = await fetchPdfArrayBuffer(normalizedUrl);
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

    if (arrayBuffer && arrayBuffer.byteLength > 0) {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        pdfDoc = await loadingTask.promise;
      } catch (err) {
        console.warn('PDF loading from ArrayBuffer failed...', err);
      }
    }

    // Try pdfjs-dist direct URL load
    if (!pdfDoc) {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: normalizedUrl });
        pdfDoc = await loadingTask.promise;
      } catch (err) {
        console.warn('PDF loading from direct URL failed...', err);
      }
    }

    if (pdfDoc && pdfDoc.numPages >= 1) {
      const page = await pdfDoc.getPage(1);

      const targetWidth = 600;
      const targetHeight = 900;

      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const scaleX = targetWidth / unscaledViewport.width;
      const scaleY = targetHeight / unscaledViewport.height;
      const scale = Math.min(scaleX, scaleY);

      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return {
          success: false,
          error: 'Az első oldal feldolgozása sikertelen volt.',
        };
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const offsetX = (targetWidth - viewport.width) / 2;
      const offsetY = (targetHeight - viewport.height) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas as any,
      };

      await page.render(renderContext).promise;
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

      return {
        success: true,
        imageUrl: dataUrl,
        generatedAt: new Date().toISOString(),
        sourceUrl: cleanUrl,
      };
    }

    // 4. Strategy 3: Direct Image Link Rendering (for PNG, JPG, WebP)
    const directImageCover = await tryRenderAsImage(normalizedUrl);
    if (directImageCover) {
      return {
        success: true,
        imageUrl: directImageCover,
        generatedAt: new Date().toISOString(),
        sourceUrl: cleanUrl,
      };
    }

    return {
      success: false,
      error: 'A dokumentum nem érhető el vagy nem tölthető le.',
    };
  } catch (err: any) {
    console.error('PDF Cover generation error:', err);
    return {
      success: false,
      error: 'Az első oldal feldolgozása sikertelen volt.',
    };
  }
}
