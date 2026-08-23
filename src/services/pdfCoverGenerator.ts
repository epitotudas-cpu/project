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
 * Validates protocol, hostname, and SSRF restrictions on target URL.
 */
export function isValidPdfUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!urlStr || !urlStr.trim()) {
    return { valid: false, error: 'Az előnézeti / letöltési URL nem érvényes.' };
  }

  const trimmed = urlStr.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'Az előnézeti / letöltési URL nem érvényes.' };
  }

  try {
    const parsed = new URL(trimmed);
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
 * Fetches PDF binary ArrayBuffer using direct fetch + CORS proxies fallback.
 */
async function fetchPdfArrayBuffer(cleanUrl: string): Promise<ArrayBuffer | null> {
  // Strategy 1: Direct fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/pdf,application/octet-stream,*/*',
      },
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0 && buffer.byteLength <= 35000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('Direct PDF fetch failed (likely CORS restriction), trying proxy 1...', e);
  }

  // Strategy 2: CORS Proxy (corsproxy.io)
  try {
    const proxyUrl1 = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(proxyUrl1, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0 && buffer.byteLength <= 35000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('Proxy 1 fetch failed, trying proxy 2...', e);
  }

  // Strategy 3: CORS Proxy (allorigins)
  try {
    const proxyUrl2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(proxyUrl2, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0 && buffer.byteLength <= 35000000) {
        return buffer;
      }
    }
  } catch (e) {
    console.warn('Proxy 2 fetch failed...', e);
  }

  return null;
}

/**
 * Downloads page 1 of target PDF, renders it to a 2:3 ratio PNG/JPEG DataURL.
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

  try {
    // 2. Fetch binary buffer via direct or CORS proxies
    const arrayBuffer = await fetchPdfArrayBuffer(cleanUrl);

    if (!arrayBuffer) {
      return {
        success: false,
        error: 'A dokumentum nem érhető el vagy nem tölthető le.',
      };
    }

    if (arrayBuffer.byteLength > 35000000) {
      return {
        success: false,
        error: 'A dokumentum mérete meghaladja a megengedett 30 MB-os limitet.',
      };
    }

    // 3. Verify PDF signature: look for `%PDF-` in the first 1024 bytes
    const sampleHeader = new Uint8Array(arrayBuffer.slice(0, Math.min(1024, arrayBuffer.byteLength)));
    let headerStr = '';
    for (let i = 0; i < sampleHeader.length; i++) {
      headerStr += String.fromCharCode(sampleHeader[i]);
    }

    if (!headerStr.includes('%PDF-')) {
      return {
        success: false,
        error: 'A megadott hivatkozás nem közvetlen PDF-fájlra mutat.',
      };
    }

    // 4. Load PDF with pdfjs-dist
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;

    if (pdfDoc.numPages < 1) {
      return {
        success: false,
        error: 'Az első oldal feldolgozása sikertelen volt.',
      };
    }

    // Get Page 1
    const page = await pdfDoc.getPage(1);

    // Prepare 2:3 Canvas (600px width x 900px height)
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

    // Fill clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Center page on canvas
    const offsetX = (targetWidth - viewport.width) / 2;
    const offsetY = (targetHeight - viewport.height) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    ctx.restore();

    // Convert canvas to Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    return {
      success: true,
      imageUrl: dataUrl,
      generatedAt: new Date().toISOString(),
      sourceUrl: cleanUrl,
    };
  } catch (err: any) {
    console.error('PDF Cover generation error:', err);
    return {
      success: false,
      error: 'Az első oldal feldolgozása sikertelen volt.',
    };
  }
}
