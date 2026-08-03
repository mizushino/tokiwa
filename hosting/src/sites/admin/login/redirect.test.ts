import { describe, expect, it } from 'vite-plus/test';

import { getSafeLoginRedirect } from './redirect.js';

describe('getSafeLoginRedirect', () => {
  const origin = 'https://admin.example.com';

  it('preserves a local path with its query and hash', () => {
    expect(getSafeLoginRedirect('?redirect=%2Fprojects%3Ftab%3Dusers%23member', origin)).toBe(
      '/projects?tab=users#member'
    );
  });

  it.each([
    '?redirect=https%3A%2F%2Fexample.com',
    '?redirect=%2F%2Fexample.com',
    '?redirect=javascript%3Aalert%281%29',
    '?redirect=%2F%5Cexample.com',
  ])('rejects a non-local redirect: %s', (search) => {
    expect(getSafeLoginRedirect(search, origin)).toBe('/');
  });

  it('uses the site root when redirect is absent', () => {
    expect(getSafeLoginRedirect('', origin)).toBe('/');
  });
});
