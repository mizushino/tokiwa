import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { beforeUserCreated } from 'firebase-functions/v2/identity';

import { userDocumentPath, type UserData } from '@firestore/types/user.js';
import { UserDocument } from 'src/models/user.js';
import { region } from 'src/options.js';

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

/**
 * Generate image URL from Firebase Storage path
 * @param path - Storage path or HTTPS URL
 * @returns Firebase Storage public URL
 */
function getFirebaseImageURL(path?: string): string {
  if (!path || path.startsWith('https://')) {
    return path ?? '';
  }
  const encodedPath = encodeURIComponent(`${path}256.webp`);
  const bucket = getStorage().bucket().name;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}

/**
 * Update user's custom claims (custom data in JWT)
 * @param uid - User ID
 * @param user - User data (sets empty claims if undefined)
 */
export async function updateCustomUserClaims(uid: string, user?: UserData): Promise<void> {
  const claims = user ? { p: user.permissions ?? {}, a: user.admin ?? false } : {};
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
): Promise<void> {
  await getFirestore().runTransaction(async (transaction) => {
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
      await updateCustomUserClaims(uid, userData);
      await userDocumentByEmail.delete(transaction);
    }

    const finalDocument = new UserDocument({ uid }, userData);
    await finalDocument.save(false, transaction);
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

  await handleUserCreated(
    userRecord.uid,
    userRecord.email,
    userRecord.displayName ?? null,
    userRecord.photoURL ?? null
  );
});

/**
 * Handle user document changes: sync Firebase Authentication user info and custom claims
 * This function is extracted for testability
 */
export async function handleUserWritten(uid: string, user?: UserData): Promise<void> {
  if (user) {
    try {
      const photoURL = getFirebaseImageURL(user.image);
      await getAuth().updateUser(uid, {
        displayName: user.displayName,
        ...(photoURL ? { photoURL } : {}),
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
 * Trigger fired when user document is created, updated, or deleted
 * Synchronizes Firebase Authentication user info and custom claims
 */
export const written = onDocumentWritten({ region, document: userDocumentPath, retry: true }, async (event) => {
  await syncCurrentUser(event.params.uid);
});
