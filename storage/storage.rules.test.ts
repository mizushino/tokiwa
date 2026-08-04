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
const projectFilePath = 'projects/project-1/file.txt';
const inactiveMetadata: Record<string, string>[] = [{}, { active: 'false' }];

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

  async function seedProjectFile(metadata: Record<string, string>): Promise<void> {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context
        .storage()
        .ref(projectFilePath)
        .put(new Uint8Array([1]), {
          contentType: 'text/plain',
          customMetadata: metadata,
        });
    });
  }

  function projectReaderStorage(): ReturnType<ReturnType<typeof testEnvironment.authenticatedContext>['storage']> {
    return testEnvironment
      .authenticatedContext('reader-1', {
        p: { projects: ['project-1:r'] },
      })
      .storage();
  }

  it('allows a manager role claim to write project storage', async () => {
    const storage = testEnvironment
      .authenticatedContext('manager-1', {
        p: { projects: ['project-1:m'] },
      })
      .storage();

    await assertSucceeds(
      Promise.resolve(
        storage.ref('projects/project-1/file.txt').put(new Uint8Array([1]), {
          contentType: 'text/plain',
        })
      )
    );
  });

  it('allows a reader to read an active project file without an optional date range', async () => {
    await seedProjectFile({ active: 'true' });

    await assertSucceeds(projectReaderStorage().ref(projectFilePath).getDownloadURL());
  });

  it.each(inactiveMetadata)('rejects a project file that is not active: %j', async (metadata) => {
    await seedProjectFile(metadata);

    await assertFails(projectReaderStorage().ref(projectFilePath).getDownloadURL());
  });

  it('enforces the project file begin date', async () => {
    const now = Math.floor(Date.now() / 1000);

    await seedProjectFile({ active: 'true', beginDate: String(now + 3600) });
    await assertFails(projectReaderStorage().ref(projectFilePath).getDownloadURL());

    await seedProjectFile({ active: 'true', beginDate: String(now - 3600) });
    await assertSucceeds(projectReaderStorage().ref(projectFilePath).getDownloadURL());
  });

  it('enforces the project file end date', async () => {
    const now = Math.floor(Date.now() / 1000);

    await seedProjectFile({ active: 'true', endDate: String(now - 3600) });
    await assertFails(projectReaderStorage().ref(projectFilePath).getDownloadURL());

    await seedProjectFile({ active: 'true', endDate: String(now + 3600) });
    await assertSucceeds(projectReaderStorage().ref(projectFilePath).getDownloadURL());
  });

  it('allows a reader to read an active project file within its date range', async () => {
    const now = Math.floor(Date.now() / 1000);
    await seedProjectFile({
      active: 'true',
      beginDate: String(now - 3600),
      endDate: String(now + 3600),
    });

    await assertSucceeds(projectReaderStorage().ref(projectFilePath).getDownloadURL());
  });

  it('rejects writing an object at the project root', async () => {
    const storage = testEnvironment
      .authenticatedContext('manager-1', {
        p: { projects: ['project-1:m'] },
      })
      .storage();

    await assertFails(
      Promise.resolve(
        storage.ref('projects/project-1').put(new Uint8Array([1]), {
          contentType: 'text/plain',
        })
      )
    );
  });

  it('rejects project IDs containing the role delimiter', async () => {
    const storage = testEnvironment
      .authenticatedContext('manager-1', {
        p: { projects: ['project:invalid:m'] },
      })
      .storage();

    await assertFails(
      Promise.resolve(
        storage.ref('projects/project:invalid/file.txt').put(new Uint8Array([1]), {
          contentType: 'text/plain',
        })
      )
    );
  });

  it('allows a user to upload a valid avatar image', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertSucceeds(
      Promise.resolve(
        storage.ref('users/user-1/avatar/profile').put(new Uint8Array([137, 80, 78, 71]), {
          contentType: 'image/png',
        })
      )
    );
  });

  it('rejects additional avatar filenames', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertFails(
      Promise.resolve(
        storage.ref('users/user-1/avatar/another-profile').put(new Uint8Array([137, 80, 78, 71]), {
          contentType: 'image/png',
        })
      )
    );
  });

  it("rejects writing another user's fixed avatar", async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertFails(
      Promise.resolve(
        storage.ref('users/user-2/avatar/profile').put(new Uint8Array([137, 80, 78, 71]), {
          contentType: 'image/png',
        })
      )
    );
  });

  it('rejects an avatar with an unsafe MIME type', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertFails(
      Promise.resolve(
        storage.ref('users/user-1/avatar/profile').put(new Uint8Array([1]), {
          contentType: 'image/svg+xml',
        })
      )
    );
  });

  it('rejects an avatar larger than 5 MiB', async () => {
    const storage = testEnvironment.authenticatedContext('user-1').storage();

    await assertFails(
      Promise.resolve(
        storage.ref('users/user-1/avatar/profile').put(new Uint8Array(5 * mebibyte + 1), {
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
