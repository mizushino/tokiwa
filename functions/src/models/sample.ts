import { FirestoreCollection, timeId } from '@mzsn/firestore';

import { sampleCollectionPath, sampleDocumentPath, type SampleData, type SampleKey } from '@firestore/types/sample.js';
import { TimestampedDocument, timestampDefaults } from 'src/models/timestamped-document.js';

/**
 * Firestore document representing a sample.
 *
 * This class handles CRUD operations for sample documents in Firestore.
 * Used as a template for creating new document models.
 */
export class SampleDocument extends TimestampedDocument<SampleKey, SampleData> {
  static pathTemplate = sampleDocumentPath;

  /**
   * Returns the default key structure for a new sample document.
   * Generates a new unique ID for the id field.
   */
  public static get defaultKey(): SampleKey {
    return {
      id: timeId(),
    };
  }

  /**
   * Returns the default data structure for a new sample document.
   * Initializes empty fields with current timestamps.
   */
  public static get defaultData(): SampleData {
    return {
      name: '',
      count: 0,
      ...timestampDefaults(),
    };
  }
}

/**
 * Firestore collection for managing sample documents.
 *
 * Provides methods for querying and managing multiple sample documents.
 */
export class SampleCollection extends FirestoreCollection<never, SampleKey, SampleData, SampleDocument> {
  static pathTemplate = sampleCollectionPath;
  static documentClass = SampleDocument;
}
