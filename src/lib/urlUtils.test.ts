import { describe, it, expect } from 'vitest';
import { sanitizeExternalUrl } from './urlUtils';

describe('sanitizeExternalUrl', () => {
  it('allows valid http and https URLs', () => {
    expect(sanitizeExternalUrl('https://www.epitotudas.hu/test')).toBe('https://www.epitotudas.hu/test');
    expect(sanitizeExternalUrl('http://example.com')).toBe('http://example.com');
  });

  it('blocks javascript:, data:, vbscript:, and protocol-relative URLs', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeExternalUrl('  JaVaScRiPt:alert(1)')).toBeUndefined();
    expect(sanitizeExternalUrl('java\nscript:alert(1)')).toBeUndefined();
    expect(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(sanitizeExternalUrl('vbscript:msgbox(1)')).toBeUndefined();
    expect(sanitizeExternalUrl('//evil.example/phish')).toBeUndefined();
  });

  it('supports allowAutoHttps for bare domains without breaking scheme blocking', () => {
    expect(sanitizeExternalUrl('epitotudas.hu', { allowAutoHttps: true })).toBe('https://epitotudas.hu');
    expect(sanitizeExternalUrl('javascript:alert(1)', { allowAutoHttps: true })).toBeUndefined();
  });

  it('supports allowRelative only for single-slash paths', () => {
    expect(sanitizeExternalUrl('/docs/spec.pdf', { allowRelative: true })).toBe('/docs/spec.pdf');
    expect(sanitizeExternalUrl('//evil.com/spec.pdf', { allowRelative: true })).toBeUndefined();
  });
});
