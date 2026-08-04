import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { getAppSite, loadSiteEnvironment } from '../../vite.config';

describe('getAppSite', () => {
  it.each([['default'], ['admin'], ['customer-2'], ['site123'], ['123-site']])(
    'accepts a kebab-case site name: %s',
    (site) => {
      expect(getAppSite(site)).toBe(site);
    }
  );

  it('uses default when APP_SITE is absent or empty', () => {
    expect(getAppSite()).toBe('default');
    expect(getAppSite('')).toBe('default');
  });

  it.each([
    '..',
    '../admin',
    'admin/default',
    'admin\\default',
    '/tmp/site',
    'Admin',
    'admin_site',
    'admin--site',
    '-admin',
    'admin-',
    ' admin',
  ])('rejects an invalid site name: %s', (site) => {
    expect(() => getAppSite(site)).toThrow(`Invalid APP_SITE: ${site}`);
  });
});

describe('loadSiteEnvironment', () => {
  const temporaryDirectories: string[] = [];
  const environmentKeys = ['VITE_SHARED_TEST_VALUE', 'VITE_OVERRIDE_TEST_VALUE'] as const;
  const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of environmentKeys) {
      const originalValue = originalEnvironment[key];
      if (originalValue === undefined) {
        Reflect.deleteProperty(process.env, key);
      } else {
        process.env[key] = originalValue;
      }
    }
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function createEnvironmentFiles(): string {
    const hostingDirectory = mkdtempSync(join(tmpdir(), 'tokiwa-hosting-env-'));
    temporaryDirectories.push(hostingDirectory);
    const siteDirectory = join(hostingDirectory, 'src', 'sites', 'default');
    mkdirSync(siteDirectory, { recursive: true });
    writeFileSync(
      join(hostingDirectory, '.env.test'),
      'VITE_SHARED_TEST_VALUE=shared\nVITE_OVERRIDE_TEST_VALUE=shared\n'
    );
    writeFileSync(join(siteDirectory, '.env.test'), 'VITE_OVERRIDE_TEST_VALUE=site\n');
    return hostingDirectory;
  }

  it('loads shared values and applies site-specific overrides', () => {
    const environment = loadSiteEnvironment('test', 'default', createEnvironmentFiles());

    expect(environment.VITE_SHARED_TEST_VALUE).toBe('shared');
    expect(environment.VITE_OVERRIDE_TEST_VALUE).toBe('site');
  });

  it('keeps shell environment variables at the highest priority', () => {
    process.env.VITE_OVERRIDE_TEST_VALUE = 'shell';

    const environment = loadSiteEnvironment('test', 'default', createEnvironmentFiles());

    expect(environment.VITE_OVERRIDE_TEST_VALUE).toBe('shell');
  });
});
