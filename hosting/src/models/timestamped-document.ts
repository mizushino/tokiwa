import { FirestoreDocument } from '@mzsn/firestore/web';

/**
 * Timestamp fields shared by every Firestore document type in this project.
 */
export interface TimestampedData {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns fresh creation/update timestamps for use in `defaultData`.
 */
export function timestampDefaults(): TimestampedData {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Base class for this project's client-side Firestore documents.
 *
 * Stamps createdAt on the first save and refreshes updatedAt on every save,
 * so concrete models only need to define their key/data defaults.
 */
export class TimestampedDocument<Key, Data extends TimestampedData> extends FirestoreDocument<Key, Data> {
  /**
   * Lifecycle hook that runs before saving the document.
   * Automatically updates the updatedAt timestamp to the current time.
   */
  protected override beforeSave(): void {
    const now = new Date();
    const data: TimestampedData = this.data;
    data.createdAt ??= now;
    data.updatedAt = now;
  }
}
