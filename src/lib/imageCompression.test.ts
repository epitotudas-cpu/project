import { describe, it, expect } from 'vitest';
import {
  detectImageMimeFromBytes,
  calculateTargetDimensions,
  formatFileSize,
  resolveCompressedOutputFormat,
} from './imageCompression';

describe('imageCompression helpers', () => {
  it('detects JPEG, PNG, and WebP magic bytes and rejects fake extensions/HTML', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const htmlPayload = new TextEncoder().encode('<html><script>alert(1)</script></html>');

    expect(detectImageMimeFromBytes(jpeg)).toBe('image/jpeg');
    expect(detectImageMimeFromBytes(png)).toBe('image/png');
    expect(detectImageMimeFromBytes(webp)).toBe('image/webp');
    expect(detectImageMimeFromBytes(htmlPayload)).toBeNull();
    expect(detectImageMimeFromBytes(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });

  it('downscales oversized images preserving aspect ratio and never upscales small images', () => {
    expect(calculateTargetDimensions(3840, 2160, 1920)).toEqual({ width: 1920, height: 1080 });
    expect(calculateTargetDimensions(1080, 3840, 1920)).toEqual({ width: 540, height: 1920 });
    expect(calculateTargetDimensions(800, 600, 1920)).toEqual({ width: 800, height: 600 });
    expect(() => calculateTargetDimensions(0, 100)).toThrow();
  });

  it('formats file sizes clearly', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  it('resolves WebP and PNG fallback output formats and rejects unsupported MIME types', () => {
    expect(resolveCompressedOutputFormat('image/webp')).toEqual({ mime: 'image/webp', ext: 'webp' });
    expect(resolveCompressedOutputFormat('image/png')).toEqual({ mime: 'image/png', ext: 'png' });
    expect(() => resolveCompressedOutputFormat('image/svg+xml')).toThrow();
    expect(() => resolveCompressedOutputFormat('')).toThrow();
  });
});
