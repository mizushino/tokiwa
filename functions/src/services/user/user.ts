import { isDeepStrictEqual } from 'node:util';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { beforeUserCreated } from 'firebase-functions/v2/identity';

import { userDocumentPath, type UserData } from '@firestore/types/user.js';
import { UserDocument } from 'src/models/user.js';
import { region } from 'src/options.js';

import { getCustomUserClaims, type UserCustomClaims } from './custom-claims.js';

const nonRetryableAuthErrorCodes = new Set([
  'auth/user-not-found',
  'auth/claims-too-large',
  'auth/invalid-claims',
  'auth/argument-error',
  'auth/invalid-display-name',
  'auth/invalid-photo-url',
  'auth/invalid-uid',
  'auth/reserved-claim',
]);
const MAX_USER_SYNC_ATTEMPTS = 3;

export function isNonRetryableAuthError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    nonRetryableAuthErrorCodes.has(error.code)
  );
}

function handleAuthSyncError(message: string, error: unknown): void {
  if (isNonRetryableAuthError(error)) {
    logger.error(message, error);
    return;
  }
  throw error;
}

function getAuthPhotoURL(image?: string): string | undefined {
  return image?.startsWith('https://') ? image : undefined;
}

/**
 * Update user's custom claims (custom data in JWT)
 * @param uid - User ID
 * @param user - User data (sets empty claims if undefined)
 */
export async function updateCustomUserClaims(uid: string, user?: UserData): Promise<void> {
  const claims = user ? getCustomUserClaims(user) : {};
  await getAuth().setCustomUserClaims(uid, claims);
}

/**
 * Handle user creation logic: create user document and inherit pre-registered permissions
 * This function is extracted for testability
 */
export async function handleUserCreated(
  uid: string,
  email: string,
  displayName: string | null,
  photoURL: string | null
): Promise<UserCustomClaims> {
  return getFirestore().runTransaction(async (transaction) => {
    const userDocument = new UserDocument({ uid });
    await userDocument.get(transaction);

    let userData = userDocument.data;
    if (!userDocument.exists) {
      userData = {
        ...UserDocument.defaultData,
        displayName: displayName ?? '',
        email,
        image: photoURL ?? '',
      };
    }

    const userDocumentByEmail = new UserDocument({ uid: email });
    await userDocumentByEmail.get(transaction);
    if (userDocumentByEmail.exists) {
      userData = {
        ...userData,
        admin: userDocumentByEmail.data.admin ?? userData.admin,
        permissions: userDocumentByEmail.data.permissions ?? userData.permissions,
      };
      await userDocumentByEmail.delete(transaction);
    }

    const finalDocument = new UserDocument({ uid }, userData);
    await finalDocument.save(false, transaction);
    return getCustomUserClaims(userData);
  });
}

/**
 * Trigger before user creation (blocking function)
 * Creates user document in Firestore and inherits pre-registered permissions if available by email
 */
export const created = beforeUserCreated({ region }, async (event) => {
  const userRecord = event.data;
  if (!userRecord?.email) {
    return;
  }

  const customClaims = await handleUserCreated(
    userRecord.uid,
    userRecord.email,
    userRecord.displayName ?? null,
    userRecord.photoURL ?? null
  );
  return { customClaims };
});

/**
 * Handle user document changes: sync Firebase Authentication user info and custom claims
 * This function is extracted for testability
 */
export async function handleUserWritten(uid: string, user?: UserData): Promise<void> {
  if (user) {
    try {
      const photoURL = user.image ? getAuthPhotoURL(user.image) : null;
      await getAuth().updateUser(uid, {
        displayName: user.displayName,
        ...(photoURL !== undefined ? { photoURL } : {}),
      });
    } catch (error) {
      handleAuthSyncError(`Failed to update Auth user ${uid}:`, error);
    }
  }

  try {
    await updateCustomUserClaims(uid, user);
  } catch (error) {
    handleAuthSyncError(`Failed to update custom claims for user ${uid}:`, error);
  }
}

/**
 * Re-read the current user document before syncing Firebase Auth.
 * This keeps delayed or retried events from applying an older snapshot.
 */
export async function syncCurrentUser(uid: string): Promise<void> {
  const userReference = getFirestore().doc(`users/${uid}`);

  for (let attempt = 0; attempt < MAX_USER_SYNC_ATTEMPTS; attempt += 1) {
    const before = await userReference.get();
    await handleUserWritten(uid, before.exists ? (before.data() as UserData) : undefined);

    const after = await userReference.get();
    const unchanged =
      (!before.exists && !after.exists) ||
      (before.exists &&
        after.exists &&
        before.updateTime !== undefined &&
        after.updateTime !== undefined &&
        before.updateTime.isEqual(after.updateTime));
    if (unchanged) {
      return;
    }
  }

  throw new Error(`User document ${uid} kept changing during Auth synchronization.`);
}

/**
 * Return whether a user document change affects Firebase Auth or custom claims.
 * Profile preferences such as language do not need Auth synchronization.
 */
export function hasAuthRelevantUserChange(before?: UserData, after?: UserData): boolean {
  if (!before || !after) {
    return true;
  }

  return (
    before.displayName !== after.displayName ||
    before.image !== after.image ||
    before.admin !== after.admin ||
    !isDeepStrictEqual(before.permissions, after.permissions)
  );
}

/**
 * Trigger fired when user document is created, updated, or deleted
 * Synchronizes Firebase Authentication user info and custom claims
 */
export const written = onDocumentWritten({ region, document: userDocumentPath, retry: true }, async (event) => {
  const before = event.data?.before.data() as UserData | undefined;
  const after = event.data?.after.data() as UserData | undefined;
  if (!hasAuthRelevantUserChange(before, after)) {
    return;
  }

  await syncCurrentUser(event.params.uid);
});
