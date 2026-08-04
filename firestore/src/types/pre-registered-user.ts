import type { TimestampedData } from './timestamped.js';

export const preRegisteredUserCollectionPath = 'preRegisteredUsers';
export const preRegisteredUserDocumentPath = `${preRegisteredUserCollectionPath}/{emailHash}`;

export interface PreRegisteredUserKey {
  emailHash: string;
}

export interface PreRegisteredUserData extends TimestampedData {
  email: string;
  permissions?: { [key: string]: string[] };
  admin?: boolean;
}
