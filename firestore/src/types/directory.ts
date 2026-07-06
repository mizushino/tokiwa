import type { TimestampedData } from './timestamped.js';

export const directoryCollectionPath = 'directories';
export const directoryDocumentPath = `${directoryCollectionPath}/{directoryId}`;

export interface DirectoryKey {
  directoryId: string;
}

export interface DirectoryData extends TimestampedData {
  name: string;
  path: string;
}
