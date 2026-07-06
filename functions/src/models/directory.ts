import { timeId } from '@mzsn/firestore';

import { directoryDocumentPath, type DirectoryData, type DirectoryKey } from '@firestore/types/directory.js';
import { TimestampedDocument, timestampDefaults } from 'src/models/timestamped-document.js';

/**
 * Firestore document representing a directory.
 *
 * This class handles CRUD operations for directory documents in Firestore.
 * Each directory has a name, path, and timestamps for creation and updates.
 */
export class DirectoryDocument extends TimestampedDocument<DirectoryKey, DirectoryData> {
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
    return {
      name: '',
      path: '',
      ...timestampDefaults(),
    };
  }
}
