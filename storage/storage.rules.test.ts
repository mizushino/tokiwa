/// <reference types="node" />

import { readFileSync } from 'node:fs';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

const projectId = process.env.GCLOUD_PROJECT ?? 'tokiwa-template';
const rules = readFileSync(new URL('./storage.rules', import.meta.url), 'utf8');

describe('project storage role rules', () => {
  let testEnvironment: RulesTestEnvironment;

  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      projectId,
      storage: { rules },
    });
  });

  afterEach(async () => {
    await testEnvironment.clearStorage();
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it('allows a manager role claim to write project storage', async () => {
    const storage = testEnvironment
      .authenticatedContext('manager-1', {
        p: { projects: ['project-1:m'] },
      })
      .storage();

    await assertSucceeds(Promise.resolve(storage.ref('projects/project-1/file.txt').putString('data')));
  });

  it('does not treat a legacy raw project claim as a storage role', async () => {
    const storage = testEnvironment
      .authenticatedContext('legacy-1', {
        p: { projects: ['project-1'] },
      })
      .storage();

    await assertFails(Promise.resolve(storage.ref('projects/project-1/file.txt').putString('data')));
  });
});
