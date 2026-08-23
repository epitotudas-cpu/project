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
    return { valid: false, error: 'Az előnézeti URL nem érvényes.' };
  }

  const trimmed = urlStr.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'Az előnézeti URL nem érvényes.' };
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
      return { valid: false, error: 'Az előnézeti URL biztonsági okokból nem dolgozható fel.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Az előnézeti URL nem érvényes.' };
  }
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
      error: validation.error || 'Az előnézeti URL nem érvényes.',
    };
  }

  const cleanUrl = urlStr.trim();

  try {
    // 2. Fetch with 15-second timeout & 30 MB max size check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/pdf,application/octet-stream,*/*',
        },
      });
    } catch {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: 'A dokumentum nem érhető el vagy nem tölthető le.',
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'A dokumentum nem érhető el vagy nem tölthető le.',
      };
    }

    // Check Content-Length header (30MB limit = 31457280 bytes)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 31457280) {
      return {
        success: false,
        error: 'A dokumentum mérete meghaladja a megengedett 30 MB-os limitet.',
      };
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > 31457280) {
      return {
        success: false,
        error: 'A dokumentum mérete meghaladja a megengedett 30 MB-os limitet.',
      };
    }

    // 3. Verify PDF signature: first 5 bytes must be `%PDF-` (0x25, 0x50, 0x44, 0x46, 0x2D)
    const uint8 = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerStr = String.fromCharCode(...uint8);
    if (!headerStr.startsWith('%PDF-')) {
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

    // Prepare 2:3 Canvas (e.g., 600px width x 900px height)
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
