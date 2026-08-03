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
const mebibyte = 1024 * 1024;

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

  it('allows a user to upload a valid avatar image', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertSucceeds(
      Promise.resolve(
        storage.ref('users/user-1/avatar/profile.png').put(new Uint8Array([137, 80, 78, 71]), {
          contentType: 'image/png',
        })
      )
    );
  });

  it('rejects an avatar with an unsafe MIME type', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertFails(
      Promise.resolve(
        storage.ref('users/user-1/avatar/profile.svg').put(new Uint8Array([1]), {
          contentType: 'image/svg+xml',
        })
      )
    );
  });

  it('rejects an avatar larger than 5 MiB', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertFails(
      Promise.resolve(
        storage.ref('users/user-1/avatar/profile.png').put(new Uint8Array(5 * mebibyte + 1), {
          contentType: 'image/png',
        })
      )
    );
  });

  it('rejects a project file with an unsafe MIME type', async () => {
    const storage = testEnvironment
      .authenticatedContext('manager-1', {
        p: { projects: ['project-1:m'] },
      })
      .storage();

    await assertFails(
      Promise.resolve(
        storage.ref('projects/project-1/archive.bin').put(new Uint8Array([1]), {
          contentType: 'application/octet-stream',
        })
      )
    );
  });

  it('rejects a project file larger than 10 MiB', async () => {
    const storage = testEnvironment
      .authenticatedContext('manager-1', {
        p: { projects: ['project-1:m'] },
      })
      .storage();

    await assertFails(
      Promise.resolve(
        storage.ref('projects/project-1/file.txt').put(new Uint8Array(10 * mebibyte + 1), {
          contentType: 'text/plain',
        })
      )
    );
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
