import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { renderPageHtml } from '../../../vite-plugin-post-build';

describe('renderPageHtml', () => {
  const siteConfig = {
    title: 'Site',
    description: 'Site description',
    robots: 'noindex,nofollow',
    themeColor: '#ffffff',
  };

  it('replaces page metadata and site-wide placeholders', () => {
    const template =
      '<title>{title}</title><meta content="{description}"><meta content="{robots}"><meta content="{theme_color}"></head>';

    expect(
      renderPageHtml(template, { title: 'Page', description: 'Description' }, siteConfig, '<script></script>')
    ).toBe(
      '<title>Page</title><meta content="Description"><meta content="noindex,nofollow"><meta content="#ffffff"><script></script></head>'
    );
  });

  it('escapes metadata before inserting it into HTML', () => {
    const template = '<title>{title}</title><meta content="{description}"></head>';

    expect(
      renderPageHtml(
        template,
        { title: '<script>alert(1)</script>', description: '" onload="alert(1)' },
        siteConfig,
        ''
      )
    ).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(
      renderPageHtml(
        template,
        { title: '<script>alert(1)</script>', description: '" onload="alert(1)' },
        siteConfig,
        ''
      )
    ).toContain('&quot; onload=&quot;alert(1)');
  });

  it('rejects unresolved metadata placeholders', () => {
    expect(() => renderPageHtml('<title>{unknown}</title></head>', siteConfig, siteConfig, '')).toThrow(
      'Unresolved HTML placeholders: {unknown}'
    );
  });
});

describe('hosting security policy', () => {
  it.each(['default', 'admin'])('does not load third-party presentation assets in %s', (site) => {
    const template = readFileSync(resolve(process.cwd(), `src/sites/${site}/index.html`), 'utf8');

    expect(template).not.toContain('fonts.googleapis.com');
    expect(template).not.toContain('fontawesome.com');
    expect(template).not.toMatch(/<script[^>]+https?:\/\//);
  });

  it('applies the required browser security headers to both hosting targets', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), '../firebase.json'), 'utf8')) as {
      hosting: { headers: { source: string; headers: { key: string; value: string }[] }[] }[];
    };

    for (const hosting of config.hosting) {
      const headers = hosting.headers.find(({ source }) => source === '**')?.headers ?? [];
      const headerNames = headers.map(({ key }) => key);
      const csp = headers.find(({ key }) => key === 'Content-Security-Policy')?.value;

      expect(headerNames).toEqual(
        expect.arrayContaining([
          'Content-Security-Policy',
          'Referrer-Policy',
          'X-Content-Type-Options',
          'Permissions-Policy',
          'Cross-Origin-Opener-Policy',
        ])
      );
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    }
  });
});
