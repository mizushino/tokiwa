import { describe, expect, it } from 'vitest';

describe('functions entry point', () => {
  it('exports every service group', async () => {
    const index = await import('./index.js');

    expect(Object.keys(index).sort()).toEqual(['project', 'sample', 'user']);
  });
});
