import { FirestoreCollection, timeId } from '@mzsn/firestore/web';

import { sampleCollectionPath, sampleDocumentPath, type SampleData, type SampleKey } from '@firestore/types/sample.js';

import { TimestampedDocument, timestampDefaults } from './timestamped-document';

export class SampleDocument extends TimestampedDocument<SampleKey, SampleData> {
  static pathTemplate = sampleDocumentPath;

  public static get defaultKey(): SampleKey {
    return {
      id: timeId(),
    };
  }

  public static get defaultData(): SampleData {
    return {
      name: '',
      count: 0,
      ...timestampDefaults(),
    };
  }
}

export class SampleCollection extends FirestoreCollection<never, SampleKey, SampleData, SampleDocument> {
  static pathTemplate = sampleCollectionPath;
  static documentClass = SampleDocument;
}
