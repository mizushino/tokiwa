import { createHash } from 'node:crypto';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import firebaseFunctionsTest from 'firebase-functions-test';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserData } from '@firestore/types/user.js';
import { getPreRegisteredUserKey, PreRegisteredUserDocument } from 'src/models/pre-registered-user.js';
import { getFirebaseTestConfig } from 'src/test/firebase-test-config.js';
import { makeDocumentSnapshot } from 'src/test/make-document-snapshot.js';
import { waitForCondition } from 'src/test/wait-for-condition.js';

const testEnv = firebaseFunctionsTest(getFirebaseTestConfig());
const wrapBlockingFunction = <T>(fn: T): ReturnType<typeof testEnv.wrap> => testEnv.wrap(fn as never);

describe('user service E2E', () => {
  let db: Firestore;
  let auth: Auth;
  let createdUserIds: string[] = [];

  async function seedPreRegisteredUser(
    email: string,
    permissions: NonNullable<UserData['permissions']>,
    admin = false
  ): Promise<void> {
    await new PreRegisteredUserDocument(getPreRegisteredUserKey(email), {
      ...PreRegisteredUserDocument.defaultData,
      email: email.trim().toLowerCase(),
      permissions,
      admin,
    }).save();
  }

  beforeAll(() => {
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
    const [usersSnapshot, preRegisteredUsersSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('preRegisteredUsers').get(),
    ]);
    const batch = db.batch();
    usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    preRegisteredUsersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    for (const uid of createdUserIds) {
      try {
        await auth.deleteUser(uid);
      } catch (_error) {
        // User may already be deleted
      }
    }
    createdUserIds = [];

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
    it('skips Auth synchronization for a language-only change', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);
      const updateUserSpy = vi.spyOn(auth, 'updateUser');
      const setClaimsSpy = vi.spyOn(auth, 'setCustomUserClaims');
      const baseData: UserData = {
        email: 'language@example.com',
        displayName: 'Language User',
        lang: 'en',
        permissions: { projects: ['project-1:r'] },
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date('2026-01-01'),
      };
      const beforeSnap = await makeDocumentSnapshot(baseData, 'users/language-user');
      const afterSnap = await makeDocumentSnapshot(
        { ...baseData, lang: 'ja', updatedAt: new Date('2026-01-02') },
        'users/language-user'
      );

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: 'language-user' },
      });

      expect(updateUserSpy).not.toHaveBeenCalled();
      expect(setClaimsSpy).not.toHaveBeenCalled();
    });

    it('updates Auth user info and syncs custom claims', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: `test-sync-${Date.now()}@example.com`,
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      await new Promise((resolve) => setTimeout(resolve, 150));

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

      const beforeSnap = await makeDocumentSnapshot(
        { email: userRecord.email || '', displayName: 'Original Name' } as UserData,
        `users/${userRecord.uid}`
      );
      const afterSnap = await makeDocumentSnapshot(userData, `users/${userRecord.uid}`);
      await db.doc(`users/${userRecord.uid}`).set(userData);

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

      const syncedDocument = await db.doc(`users/${userRecord.uid}`).get();
      expect(syncedDocument.get('claimsUpdatedAt')).toBeInstanceOf(Timestamp);
    });

    it('clears an existing Auth photo URL when Firestore contains a Storage path', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: 'test-storage@example.com',
        password: 'password123',
        photoURL: 'https://example.com/old-image.jpg',
      });
      createdUserIds.push(userRecord.uid);

      await new Promise((resolve) => setTimeout(resolve, 100));

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

      const beforeSnap = await makeDocumentSnapshot(
        { email: 'test-storage@example.com', displayName: 'Storage Test' } as UserData,
        `users/${userRecord.uid}`
      );
      const afterSnap = await makeDocumentSnapshot(userData, `users/${userRecord.uid}`);
      await db.doc(`users/${userRecord.uid}`).set(userData);

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: userRecord.uid },
      });

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.photoURL).toBeUndefined();
      });
    });

    it('handles empty image path', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);

      const userRecord = await auth.createUser({
        email: `test-no-image-${Date.now()}@example.com`,
        password: 'password123',
        photoURL: 'https://example.com/old-image.jpg',
      });
      createdUserIds.push(userRecord.uid);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const userData: UserData = {
        email: 'test-no-image@example.com',
        displayName: 'No Image User',
        permissions: {},
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeSnap = await makeDocumentSnapshot({}, `users/${userRecord.uid}`);
      const afterSnap = await makeDocumentSnapshot(userData, `users/${userRecord.uid}`);
      await db.doc(`users/${userRecord.uid}`).set(userData);

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

      await auth.setCustomUserClaims(userRecord.uid, { p: { projects: ['proj1:o'] }, a: true });

      const beforeSnap = await makeDocumentSnapshot(
        { email: 'test-delete@example.com', displayName: 'Delete User' } as UserData,
        `users/${userRecord.uid}`
      );
      const afterSnap = await makeDocumentSnapshot(undefined, `users/${userRecord.uid}`);

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
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

      const userData: UserData = {
        email: 'missing@example.com',
        displayName: 'Missing User',
        image: 'users/profile',
        permissions: { projects: ['proj1:r'] },
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeSnap = await makeDocumentSnapshot({}, 'users/missing-user');
      const afterSnap = await makeDocumentSnapshot(userData, 'users/missing-user');
      await db.doc('users/missing-user').set(userData);

      await expect(
        wrapped({
          data: testEnv.makeChange(beforeSnap, afterSnap),
          params: { uid: 'missing-user' },
        })
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('enables retries for transient failures', async () => {
      const { written } = await import('./user.js');
      expect(written.__endpoint.eventTrigger?.retry).toBe(true);
    });

    it('rethrows transient Auth errors so the trigger can retry', async () => {
      const { handleUserWritten } = await import('./user.js');
      const transientError = new Error('temporary Auth failure');
      vi.spyOn(auth, 'updateUser').mockRejectedValueOnce(transientError);

      const userData: UserData = {
        email: 'retry@example.com',
        displayName: 'Retry User',
        admin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(handleUserWritten('retry-user', userData)).rejects.toBe(transientError);
    });

    it('uses the current user document when a stale event is retried', async () => {
      const { written } = await import('./user.js');
      const wrapped = testEnv.wrap(written);
      const userRecord = await auth.createUser({
        email: `current-${Date.now()}@example.com`,
        password: 'password123',
      });
      createdUserIds.push(userRecord.uid);

      const currentData: UserData = {
        email: userRecord.email || '',
        displayName: 'Current Name',
        permissions: { projects: ['current:o'] },
        admin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.doc(`users/${userRecord.uid}`).set(currentData);

      const staleData: UserData = {
        ...currentData,
        displayName: 'Stale Name',
        permissions: { projects: ['stale:r'] },
      };
      const beforeSnap = await makeDocumentSnapshot(undefined, `users/${userRecord.uid}`);
      const afterSnap = await makeDocumentSnapshot(staleData, `users/${userRecord.uid}`);
      await db.doc(`users/${userRecord.uid}`).set(currentData);

      await wrapped({
        data: testEnv.makeChange(beforeSnap, afterSnap),
        params: { uid: userRecord.uid },
      });

      await waitForCondition(async () => {
        const user = await auth.getUser(userRecord.uid);
        expect(user.displayName).toBe('Current Name');
        expect(user.customClaims).toEqual({ p: { projects: ['current:o'] }, a: true });
      });
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
      const { created } = await import('./user.js');

      const email = 'preregistered@example.com';
      await seedPreRegisteredUser(email, { projects: ['proj1:o', 'proj2:m'] }, true);

      const setClaimsSpy = vi.spyOn(auth, 'setCustomUserClaims');
      const wrapped = wrapBlockingFunction(created);
      const newUid = 'pending-preregistered-user';
      const result = await wrapped({
        data: {
          uid: newUid,
          email,
          emailVerified: true,
          displayName: 'Actual User',
          photoURL: null,
        },
      });

      const resultDoc = new UserDocument({ uid: newUid });
      await resultDoc.get();

      expect(resultDoc.data.admin).toBe(true);
      expect(resultDoc.data.permissions).toEqual({ projects: ['proj1:o', 'proj2:m'] });
      expect(result).toEqual({
        customClaims: {
          p: { projects: ['proj1:o', 'proj2:m'] },
          a: true,
        },
      });
      expect(setClaimsSpy).not.toHaveBeenCalled();

      const deletedDoc = new PreRegisteredUserDocument(getPreRegisteredUserKey(email));
      await deletedDoc.get();
      expect(deletedDoc.exists).toBe(false);
    });

    it('inherits pre-registered permissions through a normalized hashed email key', async () => {
      const { handleUserCreated } = await import('./user.js');

      const registeredEmail = 'Case.Sensitive/Path@Example.com';
      const signInEmail = 'case.sensitive/path@example.com';
      const emailHash = createHash('sha256').update(signInEmail).digest('hex');
      await db.doc(`preRegisteredUsers/${emailHash}`).set({
        email: signInEmail,
        permissions: { projects: ['safe-project:o'] },
        admin: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await expect(
        handleUserCreated('safe-email-path-user', registeredEmail, 'Safe User', null, true)
      ).resolves.toEqual({ p: { projects: ['safe-project:o'] }, a: true });

      const userDoc = await db.doc('users/safe-email-path-user').get();
      expect(userDoc.get('email')).toBe(signInEmail);
      expect((await db.doc(`preRegisteredUsers/${emailHash}`).get()).exists).toBe(false);
    });

    it('rejects pre-registered permissions exceeding the project limit', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { MAX_PROJECTS_PER_USER, ProjectLimitExceededError } = await import('../project/constants.js');
      const { handleUserCreated } = await import('./user.js');

      const email = 'too-many-projects@example.com';
      const projects = Array.from({ length: MAX_PROJECTS_PER_USER + 1 }, (_, index) => `project-${index}:r`);
      await seedPreRegisteredUser(email, { projects });

      await expect(handleUserCreated('too-many-projects-user', email, 'Actual User', null, true)).rejects.toThrow(
        ProjectLimitExceededError
      );

      const preRegisteredDoc = new PreRegisteredUserDocument(getPreRegisteredUserKey(email));
      await preRegisteredDoc.get();
      expect(preRegisteredDoc.exists).toBe(true);

      const userDoc = new UserDocument({ uid: 'too-many-projects-user' });
      await userDoc.get();
      expect(userDoc.exists).toBe(false);
    });

    it('does not inherit pre-registered permissions before email verification', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { created } = await import('./user.js');

      const email = 'unverified-preregistered@example.com';
      await seedPreRegisteredUser(email, { projects: ['proj1:o'] }, true);

      const wrapped = wrapBlockingFunction(created);
      const result = await wrapped({
        data: {
          uid: 'unverified-preregistered-user',
          email,
          emailVerified: false,
          displayName: 'Unverified User',
          photoURL: null,
        },
      });

      expect(result).toEqual({ customClaims: { p: {}, a: false } });

      const userDoc = new UserDocument({ uid: 'unverified-preregistered-user' });
      await userDoc.get();
      expect(userDoc.data.admin).toBe(false);
      expect(userDoc.data.permissions).toEqual({});

      const preRegisteredDoc = new PreRegisteredUserDocument(getPreRegisteredUserKey(email));
      await preRegisteredDoc.get();
      expect(preRegisteredDoc.exists).toBe(true);
    });

    it('inherits pending permissions after the email is verified', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { created, signedIn } = await import('./user.js');

      const uid = 'verified-after-signup-user';
      const email = 'verified-after-signup@example.com';
      await seedPreRegisteredUser(email, { projects: ['proj1:o'] }, true);

      await wrapBlockingFunction(created)({
        data: { uid, email, emailVerified: false, displayName: 'User', photoURL: null },
      });
      const result = await wrapBlockingFunction(signedIn)({
        data: { uid, email, emailVerified: true, displayName: 'User', photoURL: null },
      });

      expect(result).toEqual({
        customClaims: { p: { projects: ['proj1:o'] }, a: true },
      });

      const userDoc = new UserDocument({ uid });
      await userDoc.get();
      expect(userDoc.data.admin).toBe(true);
      expect(userDoc.data.permissions).toEqual({ projects: ['proj1:o'] });

      const preRegisteredDoc = new PreRegisteredUserDocument(getPreRegisteredUserKey(email));
      await preRegisteredDoc.get();
      expect(preRegisteredDoc.exists).toBe(false);
    });

    it('clears privileges for an existing unverified user', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { signedIn } = await import('./user.js');

      const uid = 'existing-unverified-user';
      await new UserDocument(
        { uid },
        {
          ...UserDocument.defaultData,
          email: 'existing-unverified@example.com',
          displayName: 'Existing User',
          permissions: { projects: ['proj1:o'] },
          admin: true,
        }
      ).save();

      const result = await wrapBlockingFunction(signedIn)({
        data: {
          uid,
          email: 'existing-unverified@example.com',
          emailVerified: false,
          displayName: 'Existing User',
          photoURL: null,
        },
      });

      expect(result).toEqual({ customClaims: { p: {}, a: false } });

      const userDoc = new UserDocument({ uid });
      await userDoc.get();
      expect(userDoc.data.admin).toBe(false);
      expect(userDoc.data.permissions).toEqual({});
    });

    it('returns early when created trigger has no user payload', async () => {
      const { created } = await import('./user.js');
      const wrapped = wrapBlockingFunction(created);

      await expect(wrapped({ data: undefined })).resolves.toBeUndefined();
    });

    it('creates a default user document when the Auth provider supplies no email', async () => {
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
      ).resolves.toEqual({ customClaims: { p: {}, a: false } });

      const doc = await db.doc('users/missing-email').get();
      expect(doc.exists).toBe(true);
      expect(doc.get('email')).toBe('');
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

      await handleUserCreated(existingUid, 'existing@example.com', 'Ignored Name', 'new-photo', true);

      const resultDoc = new UserDocument({ uid: existingUid });
      await resultDoc.get();

      expect(resultDoc.exists).toBe(true);
      expect(resultDoc.data.displayName).toBe('Existing Name');
      expect(resultDoc.data.image).toBe('existing-image');
      expect(resultDoc.data.permissions).toEqual({ projects: ['proj-existing:o'] });
      expect(resultDoc.data.admin).toBe(true);
    });

    it('synchronizes an existing user document with the normalized Auth email', async () => {
      const { UserDocument } = await import('../../models/user.js');
      const { handleUserCreated } = await import('./user.js');

      const existingUid = 'changed-email-user';
      await new UserDocument(
        { uid: existingUid },
        {
          ...UserDocument.defaultData,
          email: 'old@example.com',
          displayName: 'Existing User',
        }
      ).save();

      await handleUserCreated(existingUid, ' New.Email@Example.COM ', 'Ignored Name', null, true);

      const resultDoc = new UserDocument({ uid: existingUid });
      await resultDoc.get();
      expect(resultDoc.data.email).toBe('new.email@example.com');
    });
  });
});
