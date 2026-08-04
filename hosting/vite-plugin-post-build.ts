/// <reference types="node" />

import fs from 'fs';
import path from 'path';

interface Breadcrumb {
  '@type': string;
  '@context'?: string;
  position?: number;
  name?: string;
  item?: string;
  itemListElement?: Breadcrumb[];
}

export interface PageConfig {
  title: string;
  description: string;
  robots?: string;
  themeColor?: string;
  jsonld?: unknown;
}

interface SiteConfig extends PageConfig {
  robots: string;
  themeColor: string;
}

function normalizePath(basePath: string): string {
  let pagePath = basePath.replace(/^\/+/, '');
  if (!pagePath.endsWith('/') && pagePath.length > 0) {
    pagePath += '/';
  }
  return pagePath === '' ? '/' : '/' + pagePath;
}

function readPageConfig(filePath: string): PageConfig {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<PageConfig>;
  if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') {
    throw new Error(`${filePath} must contain string title and description fields.`);
  }
  if (parsed.robots !== undefined && typeof parsed.robots !== 'string') {
    throw new Error(`${filePath} robots must be a string.`);
  }
  if (parsed.themeColor !== undefined && typeof parsed.themeColor !== 'string') {
    throw new Error(`${filePath} themeColor must be a string.`);
  }
  return parsed as PageConfig;
}

function findPages(sitePath: string): Record<string, PageConfig> {
  const pages: Record<string, PageConfig> = {};

  function walk(dir: string, basePath = ''): void {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath, path.join(basePath, file));
      } else if (file === 'page.json') {
        pages[normalizePath(basePath)] = readPageConfig(fullPath);
      }
    }
  }

  walk(sitePath);
  return pages;
}

function createBreadcrumbJSONLD(baseUrl: string, pages: Record<string, PageConfig>): Record<string, Breadcrumb> {
  const results: Record<string, Breadcrumb> = {};

  for (const pagePath of Object.keys(pages)) {
    const pathSegments = pagePath.split('/').filter((segment) => segment.length > 0);
    const breadcrumbs: Breadcrumb[] = [];
    let accumulatedPath = '';

    for (const segment of pathSegments) {
      accumulatedPath += '/' + segment + '/';
      if (pages[accumulatedPath]) {
        breadcrumbs.push({
          '@type': 'ListItem',
          position: breadcrumbs.length + 1,
          name: pages[accumulatedPath].title,
          item: baseUrl + accumulatedPath.slice(0, -1),
        });
      }
    }

    results[pagePath] = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs,
    };
  }

  return results;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderPageHtml(
  template: string,
  pageConfig: PageConfig,
  siteConfig: SiteConfig,
  structuredDataScript: string
): string {
  const html = template
    .replaceAll('{title}', escapeHtml(pageConfig.title))
    .replaceAll('{description}', escapeHtml(pageConfig.description))
    .replaceAll('{robots}', escapeHtml(pageConfig.robots ?? siteConfig.robots))
    .replaceAll('{theme_color}', escapeHtml(siteConfig.themeColor))
    .replaceAll('</head>', `${structuredDataScript}</head>`);
  const unresolved = [...html.matchAll(/\{[a-z][a-z_-]*\}/gi)].map(([placeholder]) => placeholder);
  if (unresolved.length > 0) {
    throw new Error(`Unresolved HTML placeholders: ${[...new Set(unresolved)].join(', ')}`);
  }
  return html;
}

function generateSitemap(pages: Record<string, PageConfig>, baseUrl: string): string {
  const now = new Date();
  const lastmod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const urls = Object.keys(pages)
    .map(
      (pagePath) =>
        `\n  <url>\n    <loc>${escapeHtml(baseUrl + pagePath)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`;
}

function generateRobotsTxt(siteConfig: SiteConfig, baseUrl: string): string {
  const robotsAllowed = siteConfig.robots === 'index,follow';
  return `User-agent: *\n${robotsAllowed ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${baseUrl}/sitemap.xml`;
}

function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function PostBuildPlugin(site: string): { name: string; writeBundle(): void } {
  return {
    name: 'post-build',
    writeBundle(): void {
      const sitePath = path.resolve(process.cwd(), `src/sites/${site}`);
      if (!fs.existsSync(sitePath)) {
        throw new Error(`Site directory not found: ${sitePath}`);
      }

      const pages = findPages(sitePath);
      const rootPage = pages['/'];
      if (!rootPage) {
        throw new Error(`Root page.json not found in ${sitePath}`);
      }
      const siteConfig: SiteConfig = {
        ...rootPage,
        robots: rootPage.robots ?? 'noindex,nofollow',
        themeColor: rootPage.themeColor ?? '#ffffff',
      };

      const baseUrl = process.env.VITE_BASE_URL?.replace(/\/$/, '') ?? '';
      const breadcrumbs = createBreadcrumbJSONLD(baseUrl, pages);
      const outDir = path.resolve(process.cwd(), 'public', site);
      const builtTemplatePath = path.join(outDir, 'index.html');
      if (!fs.existsSync(builtTemplatePath)) {
        throw new Error(`Built template not found: ${builtTemplatePath}`);
      }

      const template = fs.readFileSync(builtTemplatePath, 'utf8');
      for (const [pagePath, pageConfig] of Object.entries(pages)) {
        if (pagePath.includes(':')) continue;

        const jsonld: unknown[] = [breadcrumbs[pagePath]];
        if (Array.isArray(pageConfig.jsonld)) {
          jsonld.push(...pageConfig.jsonld);
        } else if (pageConfig.jsonld) {
          jsonld.push(pageConfig.jsonld);
        }
        const structuredData = JSON.stringify(jsonld).replaceAll('<', '\\u003c');
        const script = `<script type="application/ld+json">${structuredData}</script>\n`;
        const indexHtml = renderPageHtml(template, pageConfig, siteConfig, script);
        const directoryPath = path.join(outDir, pagePath);
        fs.mkdirSync(directoryPath, { recursive: true });
        fs.writeFileSync(path.join(directoryPath, 'index.html'), indexHtml, 'utf8');
      }

      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), generateSitemap(pages, baseUrl), 'utf8');
      fs.writeFileSync(path.join(outDir, 'robots.txt'), generateRobotsTxt(siteConfig, baseUrl), 'utf8');

      for (const folderName of ['assets', '.well-known']) {
        copyDirectory(path.join(sitePath, folderName), path.join(outDir, folderName));
      }
    },
  };
}
