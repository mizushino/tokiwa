import type { TimestampedData } from './timestamped.js';

export const userCollectionPath = 'users';
export const userDocumentPath = `${userCollectionPath}/{uid}`;

export interface UserKey {
  uid: string;
}

export interface UserData extends TimestampedData {
  displayName: string;
  email: string;
  image?: string;
  permissions?: { [key: string]: string[] };
  admin?: boolean;
}
