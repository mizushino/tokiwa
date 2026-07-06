import { FirestoreCollection } from '@mzsn/firestore';

import { userCollectionPath, userDocumentPath, type UserData, type UserKey } from '@firestore/types/user.js';
import { TimestampedDocument, timestampDefaults } from 'src/models/timestamped-document.js';

/**
 * Firestore document representing a user.
 *
 * This class handles CRUD operations for user documents in Firestore.
 * Each user has authentication info, profile data, permissions, and timestamps.
 */
export class UserDocument extends TimestampedDocument<UserKey, UserData> {
  static pathTemplate = userDocumentPath;

  /**
   * Returns the default key structure for a new user document.
   * The uid field should be set to the Firebase Auth user ID.
   */
  public static get defaultKey(): UserKey {
    return {
      uid: '',
    };
  }

  /**
   * Returns the default data structure for a new user document.
   * Initializes empty fields with current timestamps.
   */
  public static get defaultData(): UserData {
    return {
      email: '',
      displayName: '',
      image: '',
      permissions: {},
      admin: false,
      ...timestampDefaults(),
    };
  }
}

/**
 * Firestore collection for managing user documents.
 *
 * Provides methods for querying and managing multiple user documents.
 */
export class UserCollection extends FirestoreCollection<never, UserKey, UserData, UserDocument> {
  static pathTemplate = userCollectionPath;
  static documentClass = UserDocument;
}
