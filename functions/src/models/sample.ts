import { sampleCollectionPath, sampleDocumentPath, type SampleData, type SampleKey } from '@firestore/types/sample.js';
import { FirestoreCollection, FirestoreDocument, timeId } from '@mzsn/firestore';

/**
 * Firestore document representing a sample.
 *
 * This class handles CRUD operations for sample documents in Firestore.
 * Used as a template for creating new document models.
 */
export class SampleDocument extends FirestoreDocument<SampleKey, SampleData> {
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
    const now = new Date();
    return {
      name: '',
      count: 0,
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
 * Firestore collection for managing sample documents.
 *
 * Provides methods for querying and managing multiple sample documents.
 */
export class SampleCollection extends FirestoreCollection<never, SampleKey, SampleData, SampleDocument> {
  static pathTemplate = sampleCollectionPath;
  static documentClass = SampleDocument;
}
