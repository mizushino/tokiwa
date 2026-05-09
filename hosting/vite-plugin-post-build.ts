/// <reference types="node" />

import fs from 'fs';
import path from 'path';
import process from 'process';

interface Breadcrumb {
  '@type': string;
  '@context'?: string;
  position?: number;
  name?: string;
  item?: string;
  itemListElement?: Breadcrumb[];
}

interface Manifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  theme_color: string;
  background_color: string;
  icons: {
    src: string;
    sizes: string;
    type: string;
    purpose: string;
  }[];
}

interface AppConfig extends Manifest {
  base_url: string;
  url: string;
  image_og: string;
  image_twitter: string;
  icon_32: string;
  icon_192: string;
  icon_512: string;
  icon_192_maskable: string;
  icon_512_maskable: string;
}

interface PageConfig {
  title: string;
  description: string;
  robots?: string;
  jsonld?: unknown | unknown[];
}

/**
 * Normalize page path for URL routing
 */
function normalizePath(basePath: string): string {
  let pagePath = basePath.replace(/^\/+/, '');
  if (!pagePath.endsWith('/') && pagePath.length > 0) {
    pagePath += '/';
  }
  return pagePath === '' ? '/' : '/' + pagePath;
}

/**
 * Recursively find all page.json files in the site directory
 * Returns a map of path -> page data
 */
function findPages(sitePath: string): Record<string, PageConfig> {
  const pages: Record<string, PageConfig> = {};

  function walk(dir: string, basePath = ''): void {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath, path.join(basePath, file));
      } else if (file === 'page.json') {
        try {
          const pageData = {
            title: '',
            description: '',
            ...JSON.parse(fs.readFileSync(fullPath, 'utf8')),
          } as PageConfig;
          pages[normalizePath(basePath)] = pageData;
        } catch (error) {
          console.warn(`Failed to parse ${fullPath}:`, error);
        }
      }
    }
  }

  walk(sitePath);
  return pages;
}

/**
 * Create breadcrumb JSON-LD structured data
 */
function createBreadcrumbJSONLD(baseUrl: string, pages: Record<string, PageConfig>): Record<string, Breadcrumb> {
  const results = {} as Record<string, Breadcrumb>;

  for (const [pagePath, _] of Object.entries(pages)) {
    const pathSegments = pagePath.split('/').filter((segment) => segment.length > 0);
    const breadcrumbs: Breadcrumb[] = [];
    let accumulatedPath = '';

    for (const segment of pathSegments) {
      accumulatedPath += '/' + segment + '/';
      if (pages[accumulatedPath]) {
        breadcrumbs.push({
          '@type': 'ListItem',
          position: breadcrumbs.length + 1,
          name: pages[accumulatedPath].title ?? '',
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

/**
 * Load app configuration from app.json
 */
function loadAppConfig(sitePath: string): AppConfig | null {
  const appConfigPath = path.join(sitePath, 'app.json');
  if (!fs.existsSync(appConfigPath)) {
    console.warn(`app.json not found in ${sitePath}`);
    return null;
  }

  try {
    const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8')) as AppConfig;
    console.log('Loaded app.json');
    return appConfig;
  } catch (error) {
    console.warn(`Failed to parse app.json:`, error);
    return null;
  }
}

/**
 * Generate page title with app name suffix
 */
function generateTitle(pageTitle: string, appConfig: AppConfig): string {
  const titlePart = pageTitle ?? '';
  const namePart = appConfig.name ?? appConfig.short_name ?? '';
  const shortNamePart = appConfig.short_name ?? appConfig.name ?? '';
  if (!titlePart) {
    return namePart;
  } else if (!namePart || pageTitle === namePart || pageTitle === shortNamePart) {
    return pageTitle;
  }
  return titlePart + ' | ' + shortNamePart;
}

/**
 * Replace all placeholders in HTML template
 */
function replacePlaceholders(
  template: string,
  pageConfig: PageConfig,
  appConfig: AppConfig,
  pagePath: string,
  script: string
): string {
  return template
    .replaceAll('{title}', generateTitle(pageConfig.title, appConfig))
    .replaceAll('{description}', pageConfig.description ?? '')
    .replaceAll('{base_url}', appConfig.base_url)
    .replaceAll('{theme_color}', appConfig.theme_color)
    .replaceAll('{short_name}', appConfig.short_name)
    .replaceAll('{robots}', pageConfig.robots ?? 'noindex,nofollow')
    .replaceAll('{canonical_url}', `${appConfig.url}${pagePath}`)
    .replaceAll('{url}', `${appConfig.url}${pagePath}`)
    .replaceAll('{image_og}', appConfig.image_og)
    .replaceAll('{image_twitter}', appConfig.image_twitter)
    .replaceAll('{icon_32}', appConfig.icon_32)
    .replaceAll('{icon_192}', appConfig.icon_192)
    .replaceAll('{icon_512}', appConfig.icon_512)
    .replaceAll('{icon_192_maskable}', appConfig.icon_192_maskable)
    .replaceAll('{icon_512_maskable}', appConfig.icon_512_maskable)
    .replaceAll('</head>', `${script}</head>`);
}

/**
 * Generate manifest.json from app.json
 */
function generateManifest(appConfig: AppConfig): Manifest {
  return {
    name: appConfig.name,
    short_name: appConfig.short_name,
    description: appConfig.description,
    start_url: appConfig.start_url,
    display: appConfig.display,
    theme_color: appConfig.theme_color,
    background_color: appConfig.background_color,
    icons: [
      {
        src: appConfig.icon_192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: appConfig.icon_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: appConfig.icon_192_maskable,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: appConfig.icon_512_maskable,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

/**
 * Generate sitemap.xml
 */
function generateSitemap(pages: Record<string, PageConfig>, baseUrl: string): string {
  const now = new Date();
  const lastmod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const urls = Object.keys(pages)
    .map((path) => `\n  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}\n</urlset>`;
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt(pages: Record<string, PageConfig>, baseUrl: string): string {
  const rootPage = pages['/'];
  const robotsAllowed = rootPage?.robots === 'index,follow';
  return `User-agent: *\n${robotsAllowed ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${baseUrl}/sitemap.xml`;
}

/**
 * Recursively copy directory
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function PostBuildPlugin(): { name: string; writeBundle(): void } {
  return {
    name: 'post-build',
    writeBundle(): void {
      const APP_SITE = process.env.APP_SITE;
      if (!APP_SITE) {
        console.warn('APP_SITE not set, skipping post-build');
        return;
      }

      const sitePath = path.resolve(process.cwd(), `src/sites/${APP_SITE}`);
      if (!fs.existsSync(sitePath)) {
        console.warn(`Site directory not found: ${sitePath}`);
        return;
      }

      const appConfig = loadAppConfig(sitePath);
      if (!appConfig) return;

      console.log(`Scanning for pages in ${sitePath}...`);
      const pages = findPages(sitePath);
      console.log(`Found ${Object.keys(pages).length} pages`);

      if (Object.keys(pages).length === 0) return;

      const baseUrl = process.env.VITE_BASE_URL ?? '';
      const breadcrumbs = createBreadcrumbJSONLD(baseUrl, pages);
      const outDir = path.resolve(process.cwd(), 'public', APP_SITE);

      const builtTemplatePath = path.join(outDir, 'index.html');
      if (!fs.existsSync(builtTemplatePath)) {
        console.warn(`Built template not found: ${builtTemplatePath}`);
        return;
      }

      const template = fs.readFileSync(builtTemplatePath, 'utf8');

      for (const [pagePath, pageConfig] of Object.entries(pages)) {
        if (pagePath.includes(':')) {
          console.log(`  Skipping dynamic route: ${pagePath}`);
          continue;
        }

        // Build JSON-LD
        const jsonld: unknown[] = [];
        if (breadcrumbs[pagePath]) jsonld.push(breadcrumbs[pagePath]);
        if (pageConfig.jsonld) {
          if (Array.isArray(pageConfig.jsonld)) {
            jsonld.push(...pageConfig.jsonld);
          } else {
            jsonld.push(pageConfig.jsonld);
          }
        }

        const script =
          jsonld.length > 0 ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n` : '';
        const indexHtml = replacePlaceholders(template, pageConfig, appConfig, pagePath, script);

        const directoryPath = path.join(outDir, pagePath);
        if (!fs.existsSync(directoryPath)) {
          fs.mkdirSync(directoryPath, { recursive: true });
        }

        const indexHtmlPath = path.join(directoryPath, 'index.html');
        fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
        console.log(`  ${indexHtmlPath}`);
      }

      // Generate sitemap.xml
      console.log('Generating sitemap...');
      const sitemapXml = generateSitemap(pages, baseUrl);
      const sitemapXmlPath = path.join(outDir, 'sitemap.xml');
      fs.writeFileSync(sitemapXmlPath, sitemapXml, 'utf8');
      console.log(`  ${sitemapXmlPath}`);

      // Generate robots.txt
      const robotsTxt = generateRobotsTxt(pages, baseUrl);
      const robotsTxtPath = path.join(outDir, 'robots.txt');
      fs.writeFileSync(robotsTxtPath, robotsTxt, 'utf8');
      console.log(`  ${robotsTxtPath}`);

      // Generate manifest.json
      console.log('Generating manifest.json...');
      const manifest = generateManifest(appConfig);
      const manifestPath = path.join(outDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log(`  ${manifestPath}`);

      // Copy optional public folders
      const optionalFolders = ['assets', '.well-known'];
      for (const folderName of optionalFolders) {
        console.log(`Copying ${folderName}...`);
        const sourcePath = path.join(sitePath, folderName);
        const destPath = path.join(outDir, folderName);
        if (fs.existsSync(sourcePath)) {
          copyDirectory(sourcePath, destPath);
          console.log(`  ${sourcePath} -> ${destPath}`);
        } else {
          console.log(`  No ${folderName} folder found at ${sourcePath}`);
        }
      }
    },
  };
}
