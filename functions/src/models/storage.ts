import { FirestoreCollection, timeId } from '@mzsn/firestore';

import {
  storageCollectionPath,
  storageDocumentPath,
  type StorageData,
  type StorageKey,
} from '@firestore/types/storage.js';
import { TimestampedDocument, timestampDefaults } from 'src/models/timestamped-document.js';

/**
 * Firestore document representing a storage object.
 *
 * This class handles CRUD operations for storage documents in Firestore.
 * Each storage object represents a file in Cloud Storage with metadata.
 */
export class StorageDocument extends TimestampedDocument<StorageKey, StorageData> {
  static pathTemplate = storageDocumentPath;

  /**
   * Returns the default key structure for a new storage document.
   * Generates a new unique ID for the storageId field.
   */
  public static get defaultKey(): StorageKey {
    return {
      storageId: timeId(),
    };
  }

  /**
   * Returns the default data structure for a new storage document.
   * Initializes empty fields with current timestamps.
   */
  public static get defaultData(): StorageData {
    return {
      name: '',
      bucket: '',
      objectName: '',
      originalName: '',
      contentType: '',
      path: '',
      directoryId: '',
      accessLevel: 0,
      active: true,
      ...timestampDefaults(),
    };
  }
}

/**
 * Firestore collection for managing storage documents.
 *
 * Provides methods for querying and managing multiple storage documents.
 */
export class StorageCollection extends FirestoreCollection<never, StorageKey, StorageData, StorageDocument> {
  static pathTemplate = storageCollectionPath;
  static documentClass = StorageDocument;

  /**
   * Finds all storage objects in a specific directory.
   */
  static async findByDirectory(directoryId: string): Promise<StorageCollection> {
    const collection = new StorageCollection({ where: [['directoryId', '==', directoryId]] });
    await collection.get();
    return collection;
  }

  /**
   * Finds a single storage object by bucket and object name.
   */
  static async findOneByObjectName(bucket: string, objectName: string): Promise<StorageDocument | undefined> {
    const collection = new StorageCollection({
      where: [
        ['bucket', '==', bucket],
        ['objectName', '==', objectName],
      ],
    });
    await collection.get();
    return collection.first();
  }
}
