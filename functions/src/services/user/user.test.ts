import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import firebaseFunctionsTest from 'firebase-functions-test';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserData } from '@firestore/types/user.js';
import { getFirebaseTestConfig } from 'src/test/firebase-test-config.js';

const testEnv = firebaseFunctionsTest(getFirebaseTestConfig());
const wrapBlockingFunction = <T>(fn: T): ReturnType<typeof testEnv.wrap> => testEnv.wrap(fn as never);

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

describe('user service E2E', () => {
  let db: Firestore;
  let auth: Auth;
  let createdUserIds: string[] = [];

  beforeAll(() => {
    // Initialize Firebase Admin
    if (!getApps().length) {
      initializeApp();
    }
    db = getFirestore();
    auth = getAuth();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Clean up auth users that were explicitly tracked
    for (const uid of createdUserIds) {
      try {
        await auth.deleteUser(uid);
      } catch (_error) {
        // User may already be deleted
      }
    }
    createdUserIds = [];

    // Wait a bit after cleanup to avoid timing issues
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('updateCustomUserClaims', () => {
    it('updates custom claims with permissions and admin flag', async () => {
      const { updateCustomUserClaims } = await import('./user.js');

      const userRecord = await auth.createUser({
        email: 'test@example.com',
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      const userData: UserData = {
        email: 'test@example.com',
        displayName: 'Test User',
        image: 'path/to/image',
        permissions: { projects: ['proj1:o', 'proj2:r'] },
        admin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await updateCustomUserClaims(userRecord.uid, userData);

      const user = await auth.getUser(userRecord.uid);
      expect(user.customClaims).toEqual({
        p: { projects: ['proj1:o', 'proj2:r'] },
        a: true,
      });
    });

    it('sets empty claims when user is undefined', async () => {
      const { updateCustomUserClaims } = await import('./user.js');

      const userRecord = await auth.createUser({
        email: 'test2@example.com',
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      await updateCustomUserClaims(userRecord.uid, undefined);

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.customClaims).toEqual({});
      });
    });

    it('sets default values when permissions or admin is undefined', async () => {
      const { updateCustomUserClaims } = await import('./user.js');

      const userRecord = await auth.createUser({
        email: `test-defaults-${Date.now()}@example.com`,
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      // Wait for Auth Emulator to fully create the user
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userData: UserData = {
        email: userRecord.email || '',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await updateCustomUserClaims(userRecord.uid, userData);

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.customClaims).toEqual({
          p: {},
          a: false,
        });
      });
    });
  });

  describe('written trigger', () => {
    it('updates Auth user info and syncs custom claims', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: `test-sync-${Date.now()}@example.com`,
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      // Wait for Auth Emulator to fully create the user
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Save user document to Firestore first
      await db.doc(`users/${userRecord.uid}`).set({
        email: userRecord.email || '',
        displayName: 'Original Name',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const userData: UserData = {
        email: userRecord.email || '',
        displayName: 'Updated Name',
        image: 'https://example.com/image.jpg',
        permissions: { projects: ['proj1:w'] },
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        { email: userRecord.email || '', displayName: 'Original Name' } as UserData,
        `users/${userRecord.uid}`
      );
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(userData, `users/${userRecord.uid}`);

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: userRecord.uid },
      });

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.displayName).toBe('Updated Name');
        expect(user.photoURL).toBe('https://example.com/image.jpg');
        expect(user.customClaims).toEqual({
          p: { projects: ['proj1:w'] },
          a: false,
        });
      });
    });

    it('generates Firebase Storage URL from path', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: 'test-storage@example.com',
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      // Wait a bit for Auth Emulator to fully create the user
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Save user document to Firestore first
      await db.doc(`users/${userRecord.uid}`).set({
        email: 'test-storage@example.com',
        displayName: 'Storage Test',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const userData: UserData = {
        email: 'test-storage@example.com',
        displayName: 'Storage User',
        image: 'users/profile',
        permissions: {},
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        { email: 'test-storage@example.com', displayName: 'Storage Test' } as UserData,
        `users/${userRecord.uid}`
      );
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(userData, `users/${userRecord.uid}`);

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: userRecord.uid },
      });

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.photoURL).toContain('firebasestorage.googleapis.com');
        expect(user.photoURL).toContain('users%2Fprofile256.webp');
      });
    });

    it('handles empty image path', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: `test-no-image-${Date.now()}@example.com`,
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      // Wait for Auth Emulator to fully create the user
      await new Promise((resolve) => setTimeout(resolve, 150));

      const userData: UserData = {
        email: 'test-no-image@example.com',
        displayName: 'No Image User',
        permissions: {},
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeSnap = testEnv.firestore.makeDocumentSnapshot({} as UserData, `users/${userRecord.uid}`);
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(userData, `users/${userRecord.uid}`);

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: userRecord.uid },
      });

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.photoURL).toBeUndefined();
      });
    });

    it('clears custom claims when user document is deleted', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: 'test-delete@example.com',
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      // Set initial claims
      await auth.setCustomUserClaims(userRecord.uid, { p: { projects: ['proj1:o'] }, a: true });

      const beforeSnap = testEnv.firestore.makeDocumentSnapshot(
        { email: 'test-delete@example.com', displayName: 'Delete User' } as UserData,
        `users/${userRecord.uid}`
      );
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(undefined as never, `users/${userRecord.uid}`);

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: userRecord.uid },
      });

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.customClaims).toEqual({});
      });
    });

    it('logs and continues when the auth user no longer exists', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

      const userData: UserData = {
        email: 'missing@example.com',
        displayName: 'Missing User',
        image: 'users/profile',
        permissions: { projects: ['proj1:r'] },
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeSnap = testEnv.firestore.makeDocumentSnapshot({} as UserData, 'users/missing-user');
      const afterSnap = testEnv.firestore.makeDocumentSnapshot(userData, 'users/missing-user');

      await expect(
        wrapped({
          data: testEnv.makeChange(beforeSnap, afterSnap),
          params: { uid: 'missing-user' },
        })
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('created trigger', () => {
    it('creates user document on authentication signup', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { handleUserCreated } = await import('./user.js');

      const testUid = 'new-user-123';
      const email = 'newuser@example.com';
      const displayName = 'New User';
      const photoURL = null;

      await handleUserCreated(testUid, email, displayName, photoURL);

      const resultDoc = new UserDocument({ uid: testUid });
      await resultDoc.get();

      expect(resultDoc.exists).toBe(true);
      expect(resultDoc.data.email).toBe(email);
      expect(resultDoc.data.displayName).toBe(displayName);
    });

    it('inherits permissions from pre-registered email', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { handleUserCreated } = await import('./user.js');

      // Create pre-registered data keyed by email
      const email = 'preregistered@example.com';
      const preRegDoc = new UserDocument(
        { uid: email },
        {
          ...UserDocument.defaultData,
          email: email,
          displayName: 'Pre-registered',
          permissions: { projects: ['proj1:o', 'proj2:m'] },
          admin: true,
        }
      );
      await preRegDoc.save();

      // Create Auth user (simulating actual signup)
      const userRecord = await auth.createUser({
        email: email,
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);
      const newUid = userRecord.uid;

      // Wait for Auth Emulator to fully create the user
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify user exists
      await auth.getUser(newUid);

      // Call handleUserCreated (same as trigger would do)
      await handleUserCreated(newUid, email, 'Actual User', null);

      // Verify inheritance
      const resultDoc = new UserDocument({ uid: newUid });
      await resultDoc.get();

      expect(resultDoc.data.admin).toBe(true);
      expect(resultDoc.data.permissions).toEqual({ projects: ['proj1:o', 'proj2:m'] });

      // Verify custom claims were set
      const user = await auth.getUser(newUid);
      expect(user.customClaims).toEqual({
        p: { projects: ['proj1:o', 'proj2:m'] },
        a: true,
      });

      // Verify pre-registered data was deleted
      const deletedDoc = new UserDocument({ uid: email });
      await deletedDoc.get();
      expect(deletedDoc.exists).toBe(false);
    });

    it('returns early when created trigger has no user payload', async () => {
      const { created } = await import('./user.js');
      const wrapped = wrapBlockingFunction(created);

      await expect(wrapped({ data: undefined })).resolves.toBeUndefined();
    });

    it('returns early when created trigger payload has no email', async () => {
      const { created } = await import('./user.js');
      const wrapped = wrapBlockingFunction(created);

      await expect(
        wrapped({
          data: {
            uid: 'missing-email',
            email: undefined,
            displayName: 'No Email',
            photoURL: null,
          },
        })
      ).resolves.toBeUndefined();

      const doc = await db.doc('users/missing-email').get();
      expect(doc.exists).toBe(false);
    });

    it('preserves an existing user document when no pre-registration exists', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { handleUserCreated } = await import('./user.js');

      const existingUid = 'existing-user';
      const existingUser = new UserDocument(
        { uid: existingUid },
        {
          ...UserDocument.defaultData,
          email: 'existing@example.com',
          displayName: 'Existing Name',
          image: 'existing-image',
          permissions: { projects: ['proj-existing:o'] },
          admin: true,
        }
      );
      await existingUser.save();

      await handleUserCreated(existingUid, 'existing@example.com', 'Ignored Name', 'new-photo');

      const resultDoc = new UserDocument({ uid: existingUid });
      await resultDoc.get();

      expect(resultDoc.exists).toBe(true);
      expect(resultDoc.data.displayName).toBe('Existing Name');
      expect(resultDoc.data.image).toBe('existing-image');
      expect(resultDoc.data.permissions).toEqual({ projects: ['proj-existing:o'] });
      expect(resultDoc.data.admin).toBe(true);
    });
  });
});
