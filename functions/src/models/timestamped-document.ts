import { FirestoreDocument } from '@mzsn/firestore';

import type { TimestampedData } from '@firestore/types/timestamped.js';

export { type TimestampedData, timestampDefaults } from '@firestore/types/timestamped.js';

/**
 * Base class for this project's Firestore documents.
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
