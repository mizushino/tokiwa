export const directoryCollectionPath = "directories";
export const directoryDocumentPath = `${directoryCollectionPath}/{directoryId}`;

export interface DirectoryKey {
  directoryId: string;
}

export interface DirectoryData {
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}
