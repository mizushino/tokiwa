import { createHash } from 'node:crypto';

import { FirestoreCollection } from '@mzsn/firestore';

import {
  preRegisteredUserCollectionPath,
  preRegisteredUserDocumentPath,
  type PreRegisteredUserData,
  type PreRegisteredUserKey,
} from '@firestore/types/pre-registered-user.js';
import { TimestampedDocument, timestampDefaults } from 'src/models/timestamped-document.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getPreRegisteredUserKey(email: string): PreRegisteredUserKey {
  return {
    emailHash: createHash('sha256').update(normalizeEmail(email)).digest('hex'),
  };
}

export class PreRegisteredUserDocument extends TimestampedDocument<PreRegisteredUserKey, PreRegisteredUserData> {
  static pathTemplate = preRegisteredUserDocumentPath;

  public static get defaultKey(): PreRegisteredUserKey {
    return {
      emailHash: '',
    };
  }

  public static get defaultData(): PreRegisteredUserData {
    return {
      email: '',
      permissions: {},
      admin: false,
      ...timestampDefaults(),
    };
  }
}

export class PreRegisteredUserCollection extends FirestoreCollection<
  never,
  PreRegisteredUserKey,
  PreRegisteredUserData,
  PreRegisteredUserDocument
> {
  static pathTemplate = preRegisteredUserCollectionPath;
  static documentClass = PreRegisteredUserDocument;
}
