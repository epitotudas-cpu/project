export const MAX_IMAGE_DIMENSION = 1920;
export const WEBP_QUALITY = 0.82;
export const MAX_COMPRESSED_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface CompressedImageResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export function detectImageMimeFromBytes(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension = MAX_IMAGE_DIMENSION
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) {
    throw new Error('Érvénytelen képméret.');
  }
  const scale = Math.min(1, maxDimension / srcWidth, maxDimension / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * scale)),
    height: Math.max(1, Math.round(srcHeight * scale)),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function decodeImageSource(
  file: File
): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      close: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('A kép dekódolása sikertelen.'));
      el.src = objectUrl;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

export async function compressImageToWebP(
  file: File,
  options?: { maxDimension?: number; quality?: number; maxBytes?: number }
): Promise<CompressedImageResult> {
  if (!file || file.size <= 0) {
    throw new Error('Üres vagy sérült képfájl.');
  }

  const headerBuf = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detectedMime = detectImageMimeFromBytes(headerBuf);
  if (!detectedMime) {
    throw new Error(`„${file.name}”: csak érvényes JPEG, PNG vagy WebP képfájl tölthető fel.`);
  }

  const maxDimension = options?.maxDimension ?? MAX_IMAGE_DIMENSION;
  const quality = options?.quality ?? WEBP_QUALITY;
  const maxBytes = options?.maxBytes ?? MAX_COMPRESSED_IMAGE_BYTES;

  const decoded = await decodeImageSource(file);
  try {
    const { width, height } = calculateTargetDimensions(decoded.width, decoded.height, maxDimension);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('A böngésző nem támogatja a képfeldolgozást.');
    }

    ctx.clearRect(0, 0, width, height);
    decoded.draw(ctx, width, height);

    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size <= 0) {
            reject(new Error(`„${file.name}”: a WebP tömörítés sikertelen.`));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        quality
      );
    });

    if (webpBlob.size > maxBytes) {
      throw new Error(
        `„${file.name}”: a tömörített kép mérete (${formatFileSize(webpBlob.size)}) meghaladja az 5 MB-os korlátot.`
      );
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'termek-kep';
    const compressedFile = new File([webpBlob], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      width,
      height,
    };
  } finally {
    decoded.close();
  }
}
