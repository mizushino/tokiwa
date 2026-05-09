export const storageCollectionPath = "storage";
export const storageDocumentPath = `${storageCollectionPath}/{storageId}`;

export interface StorageKey {
  storageId: string;
}

export interface StorageMetadata {
  [key: string]: string | number | boolean | undefined;
}

export interface ImageStorageMetadata extends StorageMetadata {
  width: number;
  height: number;
  space: string;
  channels: number;
  chromaSubsampling: string;
  density: number;
  depth: string;
  format: string;
  hasAlpha: boolean;
}

export interface ImageStorageVariation {
  path: string;
  width: number;
  height: number;
}

export interface StorageData {
  name: string;
  bucket: string;
  objectName: string;
  originalName: string;
  contentType: string;
  path: string;
  directoryId: string;
  accessLevel: number;
  active: boolean;
  metadata?: StorageMetadata;
  beginDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageStorageData extends StorageData {
  width?: number;
  height?: number;
  variations?: Record<number, ImageStorageVariation>;
}
