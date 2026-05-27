import { FirestoreCollection, FirestoreDocument, firestore } from '@mzsn/firestore/web';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { userCollectionPath, userDocumentPath, type UserData, type UserKey } from '@firestore/types/user.js';

/**
 * Subscribe to real-time updates of a user document.
 *
 * @param uid - The user ID to subscribe to
 * @param callback - Called whenever the user document changes
 * @returns Unsubscribe function to stop listening
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToUserDocument(uid, (userData) => {
 *   if (userData?.admin) {
 *     console.log('admin access granted');
 *   }
 * });
 *
 * unsubscribe();
 * ```
 */
export function subscribeToUserDocument(uid: string, callback: (data: UserData | null) => void): Unsubscribe {
  const db = firestore();
  const userDocRef = doc(db, userCollectionPath, uid);

  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserData;
        callback(data);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Failed to subscribe to user document:', error);
      callback(null);
    }
  );
}

export class UserDocument extends FirestoreDocument<UserKey, UserData> {
  static pathTemplate = userDocumentPath;

  public static get defaultKey(): UserKey {
    return {
      uid: '',
    };
  }

  public static get defaultData(): UserData {
    const now = new Date();
    return {
      displayName: '',
      email: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  protected override beforeSave(): void {
    const now = new Date();
    this.data.createdAt ??= now;
    this.data.updatedAt = now;
  }
}

export class UserCollection extends FirestoreCollection<never, UserKey, UserData, UserDocument> {
  static pathTemplate = userCollectionPath;
  static documentClass = UserDocument;
}
