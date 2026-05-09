import {
  directoryCollectionPath,
  directoryDocumentPath,
  type DirectoryData,
  type DirectoryKey,
} from '@firestore/types/directory.js';
import { FirestoreCollection, FirestoreDocument, timeId } from '@mzsn/firestore';

/**
 * Firestore document representing a directory.
 *
 * This class handles CRUD operations for directory documents in Firestore.
 * Each directory has a name, path, and timestamps for creation and updates.
 */
export class DirectoryDocument extends FirestoreDocument<DirectoryKey, DirectoryData> {
  static pathTemplate = directoryDocumentPath;

  /**
   * Returns the default key structure for a new directory document.
   * Generates a new unique ID for the directoryId field.
   */
  public static get defaultKey(): DirectoryKey {
    return {
      directoryId: timeId(),
    };
  }

  /**
   * Returns the default data structure for a new directory document.
   * Initializes empty name and path fields with current timestamps.
   */
  public static get defaultData(): DirectoryData {
    const now = new Date();
    return {
      name: '',
      path: '',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Lifecycle hook that runs before saving the document.
   * Automatically updates the updatedAt timestamp to the current time.
   */
  protected override beforeSave(): void {
    const now = new Date();
    this.data.createdAt ??= now;
    this.data.updatedAt = now;
  }
}

/**
 * Firestore collection for managing directory documents.
 *
 * Provides methods for querying and managing multiple directory documents.
 */
export class DirectoryCollection extends FirestoreCollection<never, DirectoryKey, DirectoryData, DirectoryDocument> {
  static pathTemplate = directoryCollectionPath;
  static documentClass = DirectoryDocument;
}
