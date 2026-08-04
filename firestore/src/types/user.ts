import type { TimestampedData } from './timestamped.js';

export const userCollectionPath = 'users';
export const userDocumentPath = `${userCollectionPath}/{uid}`;

export interface UserKey {
  uid: string;
}

export type UserLanguage = 'en' | 'ja';

export interface UserData extends TimestampedData {
  displayName: string;
  email: string;
  image?: string;
  lang?: UserLanguage;
  permissions?: { [key: string]: string[] };
  admin?: boolean;
  claimsUpdatedAt?: Date;
}
