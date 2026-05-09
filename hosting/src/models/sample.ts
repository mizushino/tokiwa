import { FirestoreCollection, FirestoreDocument, timeId } from '@mzsn/firestore/web';

import { sampleCollectionPath, sampleDocumentPath, type SampleData, type SampleKey } from '@firestore/types/sample.js';

export class SampleDocument extends FirestoreDocument<SampleKey, SampleData> {
  static pathTemplate = sampleDocumentPath;

  public static get defaultKey(): SampleKey {
    return {
      id: timeId(),
    };
  }

  public static get defaultData(): SampleData {
    const now = new Date();
    return {
      name: '',
      count: 0,
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

export class SampleCollection extends FirestoreCollection<never, SampleKey, SampleData, SampleDocument> {
  static pathTemplate = sampleCollectionPath;
  static documentClass = SampleDocument;
}
