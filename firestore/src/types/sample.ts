import type { TimestampedData } from './timestamped.js';

export const sampleCollectionPath = 'samples';
export const sampleDocumentPath = `${sampleCollectionPath}/{id}`;

export interface SampleKey {
  id: string;
}

export interface SampleData extends TimestampedData {
  name: string;
  count: number;
}
