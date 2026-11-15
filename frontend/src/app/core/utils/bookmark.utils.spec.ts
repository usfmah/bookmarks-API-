import {
  displayAddress,
  displayHost,
  formatShortDate,
  isValidHttpUrl,
  monogram,
  normalizeLink,
} from './bookmark.utils';

describe('bookmark utils', () => {
  it('strips protocol and www from display addresses', () => {
    expect(displayAddress('https://www.prisma.io/docs/')).toBe('prisma.io/docs');
    expect(displayAddress('https://docs.nestjs.com')).toBe('docs.nestjs.com');
    expect(displayAddress('not a url')).toBe('not a url');
  });

  it('extracts the host without www', () => {
    expect(displayHost('https://www.prisma.io/docs')).toBe('prisma.io');
  });

  it('builds monograms, using two characters for digit-led sites', () => {
    expect(monogram('https://www.prisma.io/docs')).toBe('P');
    expect(monogram('https://12factor.net')).toBe('12');
  });

  it('normalizes links by defaulting to https', () => {
    expect(normalizeLink('example.com')).toBe('https://example.com');
    expect(normalizeLink('  https://example.com  ')).toBe('https://example.com');
    expect(normalizeLink('http://example.com')).toBe('http://example.com');
  });

  it('validates http(s) URLs only', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('nonsense')).toBe(false);
  });

  it('formats short dates', () => {
    expect(formatShortDate('2026-11-13T10:00:00.000Z')).toMatch(/Nov 1[23], 2026/);
  });
});
