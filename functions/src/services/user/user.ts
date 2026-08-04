import { isDeepStrictEqual } from 'node:util';

import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';

import { userDocumentPath, type UserData } from '@firestore/types/user.js';
import { getPreRegisteredUserKey, normalizeEmail, PreRegisteredUserDocument } from 'src/models/pre-registered-user.js';
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

function isSafeLegacyUserDocumentId(value: string): boolean {
  return value !== '' && value !== '.' && value !== '..' && !value.includes('/') && Buffer.byteLength(value) <= 1_500;
}

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

function getAuthPhotoURL(image?: string): string | null {
  if (!image) {
    return null;
  }

  try {
    const url = new URL(image);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
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
 * Create or refresh the user document and return claims appropriate for verification status.
 * Pre-registered permissions are inherited only after the email has been verified.
 */
export async function handleUserCreated(
  uid: string,
  email: string,
  displayName: string | null,
  photoURL: string | null,
  emailVerified = false
): Promise<UserCustomClaims> {
  return getFirestore().runTransaction(async (transaction) => {
    const normalizedEmail = normalizeEmail(email);
    const userDocument = new UserDocument({ uid });
    await userDocument.get(transaction);

    let userData = userDocument.data;
    let shouldSave = !userDocument.exists;
    if (!userDocument.exists) {
      userData = {
        ...UserDocument.defaultData,
        displayName: displayName ?? '',
        email: normalizedEmail,
        image: photoURL ?? '',
      };
    } else if (userData.email !== normalizedEmail) {
      userData = {
        ...userData,
        email: normalizedEmail,
      };
      shouldSave = true;
    }

    if (!emailVerified) {
      if (userData.admin !== false || !isDeepStrictEqual(userData.permissions ?? {}, {})) {
        userData = {
          ...userData,
          admin: false,
          permissions: {},
        };
        shouldSave = true;
      }
    } else if (normalizedEmail) {
      const preRegisteredUserDocument = new PreRegisteredUserDocument(getPreRegisteredUserKey(normalizedEmail));
      await preRegisteredUserDocument.get(transaction);
      let matchingPreRegistration: PreRegisteredUserDocument | UserDocument | undefined;
      if (
        preRegisteredUserDocument.exists &&
        normalizeEmail(preRegisteredUserDocument.data.email) === normalizedEmail
      ) {
        matchingPreRegistration = preRegisteredUserDocument;
      } else {
        // Read path-safe legacy records during migration from users/{email}.
        const legacyDocumentIds = [...new Set([email.trim(), normalizedEmail])].filter(isSafeLegacyUserDocumentId);
        for (const legacyDocumentId of legacyDocumentIds) {
          const legacyDocument = new UserDocument({ uid: legacyDocumentId });
          await legacyDocument.get(transaction);
          if (legacyDocument.exists && normalizeEmail(legacyDocument.data.email) === normalizedEmail) {
            matchingPreRegistration = legacyDocument;
            break;
          }
        }
      }

      if (matchingPreRegistration) {
        userData = {
          ...userData,
          admin: matchingPreRegistration.data.admin ?? userData.admin,
          permissions: matchingPreRegistration.data.permissions ?? userData.permissions,
        };
        await matchingPreRegistration.delete(transaction);
        shouldSave = true;
      }
    }

    if (shouldSave) {
      const finalDocument = new UserDocument({ uid }, userData);
      await finalDocument.save(false, transaction);
    }
    return getCustomUserClaims(userData);
  });
}

/**
 * Create the Firestore user document before the Authentication user is committed.
 * Unverified users receive no privileges and leave any pre-registration pending.
 */
export const created = beforeUserCreated({ region }, async (event) => {
  const userRecord = event.data;
  if (!userRecord) {
    return;
  }

  const customClaims = await handleUserCreated(
    userRecord.uid,
    userRecord.email ?? '',
    userRecord.displayName ?? null,
    userRecord.photoURL ?? null,
    userRecord.emailVerified
  );
  return { customClaims };
});

/**
 * Apply pre-registered permissions only after Firebase has verified the email.
 * This also clears privileges persisted by older versions for unverified users.
 */
export const signedIn = beforeUserSignedIn({ region }, async (event) => {
  const userRecord = event.data;
  if (!userRecord) {
    return;
  }

  const customClaims = await handleUserCreated(
    userRecord.uid,
    userRecord.email ?? '',
    userRecord.displayName ?? null,
    userRecord.photoURL ?? null,
    userRecord.emailVerified
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
      await getAuth().updateUser(uid, {
        displayName: user.displayName,
        photoURL: getAuthPhotoURL(user.image),
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
    const beforeData = before.exists ? (before.data() as UserData) : undefined;
    await handleUserWritten(uid, beforeData);
    if (before.exists) {
      await userReference.update({ claimsUpdatedAt: FieldValue.serverTimestamp() });
    }

    const after = await userReference.get();
    const afterData = after.exists ? (after.data() as UserData) : undefined;
    const unchanged =
      (!before.exists && !after.exists) ||
      (before.exists && after.exists && !hasAuthRelevantUserChange(beforeData, afterData));
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
