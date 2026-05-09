export const sampleCollectionPath = "samples";
export const sampleDocumentPath = `${sampleCollectionPath}/{id}`;

export interface SampleKey {
  id: string;
}

export interface SampleData {
  name: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}
