import type { ProjectUserData } from '@firestore/types/project-user.js';
import * as admin from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';
import { getFirebaseTestConfig } from 'src/test/firebase-test-config.js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const testEnv = firebaseFunctionsTest(getFirebaseTestConfig());

async function waitForCondition(assertion: () => Promise<void> | void, attempts = 20, delayMs = 100): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

async function waitForUserDocument(db: admin.firestore.Firestore, uid: string): Promise<void> {
  await waitForCondition(async () => {
    const userSnapshot = await db.collection('users').doc(uid).get();
    expect(userSnapshot.exists).toBe(true);
  });
}

describe('project service E2E', () => {
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
  });

  afterEach(async () => {
    // Clean up test data
    const usersSnapshot = await db.collection('users').get();
    const projectsSnapshot = await db.collection('projects').get();

    const batch = db.batch();
    usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    projectsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });

  it('adds owner permission when user is added to project', async () => {
    const { updateUserPermissions } = await import('./project.js');
    const { UserDocument } = await import('../../models/user.js');

    // Create user document using UserDocument class
    const userDoc = new UserDocument(
      { uid: 'user123' },
      {
        ...UserDocument.defaultData,
        email: 'user@example.com',
        displayName: 'Test User',
        permissions: { projects: [] },
      }
    );
    await userDoc.save();
    await waitForUserDocument(db, 'user123');

    const projectUserData: ProjectUserData = {
      displayName: 'Test User',
      email: 'user@example.com',
      role: 'owner',
    };

    await updateUserPermissions('proj123', 'user123', projectUserData);

    const resultDoc = new UserDocument({ uid: 'user123' });
    await waitForCondition(async () => {
      await resultDoc.get();
      expect(resultDoc.exists).toBe(true);
      expect(resultDoc.data.permissions?.projects).toContain('proj123:o');
    });
  });

  it('updates permission when user role changes', async () => {
    const { updateUserPermissions } = await import('./project.js');
    const { UserDocument } = await import('../../models/user.js');

    // Create user with existing permission
    const userDoc = new UserDocument(
      { uid: 'user456' },
      {
        ...UserDocument.defaultData,
        email: 'user@example.com',
        displayName: 'Test User',
        permissions: { projects: ['proj456:r'] },
      }
    );
    await userDoc.save();
    await waitForUserDocument(db, 'user456');

    const projectUserData: ProjectUserData = {
      displayName: 'Test User',
      email: 'user@example.com',
      role: 'manager',
    };

    await updateUserPermissions('proj456', 'user456', projectUserData);

    const resultDoc = new UserDocument({ uid: 'user456' });
    await waitForCondition(async () => {
      await resultDoc.get();
      const projects = resultDoc.data.permissions?.projects ?? [];
      expect(projects).toContain('proj456:m');
      expect(projects).not.toContain('proj456:r');
    });
  });

  it('removes permission when user is removed from project', async () => {
    const { updateUserPermissions } = await import('./project.js');
    const { UserDocument } = await import('../../models/user.js');

    const userDoc = new UserDocument(
      { uid: 'user789' },
      {
        ...UserDocument.defaultData,
        email: 'user@example.com',
        displayName: 'Test User',
        permissions: { projects: ['proj789:w', 'other:r'] },
      }
    );
    await userDoc.save();
    await waitForUserDocument(db, 'user789');

    // null means user was removed
    await updateUserPermissions('proj789', 'user789', null);

    const resultDoc = new UserDocument({ uid: 'user789' });
    await waitForCondition(async () => {
      await resultDoc.get();
      const projects = resultDoc.data.permissions?.projects ?? [];
      expect(projects).not.toContain('proj789:w');
      expect(projects).toContain('other:r');
    });
  });

  it('preserves other project permissions', async () => {
    const { updateUserPermissions } = await import('./project.js');
    const { UserDocument } = await import('../../models/user.js');

    const userDoc = new UserDocument(
      { uid: 'user999' },
      {
        ...UserDocument.defaultData,
        email: 'user@example.com',
        displayName: 'Test User',
        permissions: { projects: ['proj1:o', 'proj2:m'] },
      }
    );
    await userDoc.save();
    await waitForUserDocument(db, 'user999');

    const projectUserData: ProjectUserData = {
      displayName: 'Test User',
      email: 'user@example.com',
      role: 'writer',
    };

    await updateUserPermissions('proj3', 'user999', projectUserData);

    const resultDoc = new UserDocument({ uid: 'user999' });
    await waitForCondition(async () => {
      await resultDoc.get();
      const projects = resultDoc.data.permissions?.projects ?? [];
      expect(projects).toContain('proj1:o');
      expect(projects).toContain('proj2:m');
      expect(projects).toContain('proj3:w');
      expect(projects).toHaveLength(3);
    });
  });

  it('initializes permissions field if not exists', async () => {
    const { updateUserPermissions } = await import('./project.js');
    const { UserDocument } = await import('../../models/user.js');

    // Create user without permissions field
    const userDoc = new UserDocument(
      { uid: 'user111' },
      {
        ...UserDocument.defaultData,
        email: 'user@example.com',
        displayName: 'Test User',
        // Don't set permissions at all to test initialization
      }
    );
    await userDoc.save();
    await waitForUserDocument(db, 'user111');

    const projectUserData: ProjectUserData = {
      displayName: 'Test User',
      email: 'user@example.com',
      role: 'reader',
    };

    await updateUserPermissions('proj111', 'user111', projectUserData);

    const resultDoc = new UserDocument({ uid: 'user111' });
    await waitForCondition(async () => {
      await resultDoc.get();
      expect(resultDoc.data.permissions).toBeDefined();
      const projects = resultDoc.data.permissions?.projects ?? [];
      expect(projects).toContain('proj111:r');
    });
  });

  it('does nothing if user document does not exist', async () => {
    const { updateUserPermissions } = await import('./project.js');

    const projectUserData: ProjectUserData = {
      displayName: 'Test User',
      email: 'user@example.com',
      role: 'owner',
    };

    // Should not throw error
    await updateUserPermissions('proj222', 'nonexistent', projectUserData);

    const userDoc = await db.collection('users').doc('nonexistent').get();
    expect(userDoc.exists).toBe(false);
  });

  it('exports written trigger function', async () => {
    const { written } = await import('./project.js');
    expect(written).toBeDefined();
  });

  it('updates user permissions when written trigger receives a project user change', async () => {
    const { written } = await import('./project.js');
    const { UserDocument } = await import('../../models/user.js');
    const wrapped = testEnv.wrap(written);

    const userDoc = new UserDocument(
      { uid: 'user-trigger' },
      {
        ...UserDocument.defaultData,
        email: 'trigger@example.com',
        displayName: 'Trigger User',
        permissions: { projects: ['other:r'] },
      }
    );
    await userDoc.save();
    await waitForUserDocument(db, 'user-trigger');

    const afterData: ProjectUserData = {
      displayName: 'Trigger User',
      email: 'trigger@example.com',
      role: 'owner',
    };

    const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
      undefined as never,
      'projects/proj-trigger/users/user-trigger'
    );
    const afterSnap = testEnv.firestore.makeDocumentSnapshot(afterData, 'projects/proj-trigger/users/user-trigger');

    await wrapped({
      data: testEnv.makeChange(beforeSnap, afterSnap),
      params: { pid: 'proj-trigger', uid: 'user-trigger' },
    });

    const resultDoc = new UserDocument({ uid: 'user-trigger' });
    await waitForCondition(async () => {
      await resultDoc.get();
      expect(resultDoc.data.permissions?.projects).toContain('proj-trigger:o');
      expect(resultDoc.data.permissions?.projects).toContain('other:r');
    });
  });
});
