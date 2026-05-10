import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const resizeCalls: { width: number; height: number }[] = [];
const transformerState = {
  metadata: { width: 4096, height: 2048, format: 'jpeg' } as {
    width?: number;
    height?: number;
    format?: string;
  } | null,
  metadataError: null as Error | null,
  webpError: null as Error | null,
};

class MockTransformer {
  resize(width: number, height: number): this {
    resizeCalls.push({ width, height });
    return this;
  }

  async metadata(): Promise<{ width?: number; height?: number; format?: string } | null> {
    if (transformerState.metadataError) {
      throw transformerState.metadataError;
    }

    return transformerState.metadata;
  }

  async jpeg(_quality: number): Promise<Buffer> {
    return Buffer.from('jpeg-output');
  }

  async png(): Promise<Buffer> {
    return Buffer.from('png-output');
  }

  async webp(_quality: number): Promise<Buffer> {
    if (transformerState.webpError) {
      throw transformerState.webpError;
    }

    return Buffer.from('webp-output');
  }
}

const downloadMock = vi.fn();
const setMetadataMock = vi.fn();
const uploadMock = vi.fn();
const fileMock = vi.fn(() => ({
  download: downloadMock,
  setMetadata: setMetadataMock,
}));
const bucketMock = vi.fn(() => ({
  file: fileMock,
  upload: uploadMock,
}));

vi.mock('@napi-rs/image', () => ({
  Transformer: MockTransformer,
}));

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => ({
    bucket: bucketMock,
  })),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'fixed-download-token'),
}));

describe('storage service', () => {
  let db: Firestore;

  beforeAll(() => {
    if (!getApps().length) {
      initializeApp();
    }
    db = getFirestore();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    resizeCalls.length = 0;
    transformerState.metadata = { width: 4096, height: 2048, format: 'jpeg' };
    transformerState.metadataError = null;
    transformerState.webpError = null;
    downloadMock.mockResolvedValue([Buffer.from('image')]);
    setMetadataMock.mockResolvedValue(undefined);
    uploadMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    const storageSnapshot = await db.collection('storage').get();
    const directoriesSnapshot = await db.collection('directories').get();
    const batch = db.batch();

    storageSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    directoriesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });

  it('creates directory and storage documents for non-image uploads', async () => {
    const { handleUpload } = await import('./storage.js');
    const { DirectoryDocument } = await import('../../models/directory.js');
    const { StorageCollection } = await import('../../models/storage.js');

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/readme.txt',
        contentType: 'text/plain',
        metadata: { owner: 'alice' },
      } as never,
    });

    const directoryDocument = new DirectoryDocument({ directoryId: 'docs' });
    await directoryDocument.get();

    expect(directoryDocument.exists).toBe(true);
    expect(directoryDocument.data.name).toBe('docs');
    expect(directoryDocument.data.path).toBe('/docs');

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'docs/readme.txt');
    expect(storageDocument).toBeDefined();
    expect(storageDocument?.data.name).toBe('readme');
    expect(storageDocument?.data.directoryId).toBe('docs');
    expect(storageDocument?.data.contentType).toBe('text/plain');
    expect(storageDocument?.data.metadata).toEqual({ owner: 'alice' });
  });

  it('ignores upload events that are missing required routing data', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');

    await handleUpload({
      data: {
        bucket: 'test-bucket',
        name: 'docs/readme.txt',
        metadata: { owner: 'alice' },
      } as never,
    });

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/readme.txt',
        contentType: 'text/plain',
        contentEncoding: 'gzip',
      } as never,
    });

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/readme@128.webp',
        contentType: 'image/webp',
      } as never,
    });

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'readme.txt',
        contentType: 'text/plain',
      } as never,
    });

    expect(bucketMock).toHaveBeenCalledTimes(1);
    expect(bucketMock).toHaveBeenCalledWith('test-bucket');
    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'docs/readme.txt');
    expect(storageDocument).toBeUndefined();
  });

  it('processes image uploads, creates variations, and stores merged metadata', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'gallery/photo.jpg',
        contentType: 'image/jpeg',
        metadata: { owner: 'alice' },
      } as never,
    });

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'gallery/photo.jpg');
    const imageData = storageDocument?.data as {
      path: string;
      width?: number;
      height?: number;
      metadata?: Record<string, unknown>;
      variations?: Record<number, { path: string; width: number; height: number }>;
    };

    expect(setMetadataMock).toHaveBeenCalledWith({ metadata: { active: 'false' } });
    expect(uploadMock).toHaveBeenCalledTimes(5);
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringContaining('photo.jpg@2.webp'),
      expect.objectContaining({
        destination: 'gallery/photo.jpg@2048.webp',
        metadata: expect.objectContaining({
          contentType: 'image/webp',
          metadata: expect.objectContaining({
            firebaseStorageDownloadTokens: 'fixed-download-token',
            active: 'true',
            accessLevel: '0',
            width: '4096',
            height: '2048',
          }),
        }),
      })
    );
    expect(resizeCalls).toEqual([
      { width: 2048, height: 1024 },
      { width: 1024, height: 512 },
      { width: 512, height: 256 },
      { width: 256, height: 128 },
      { width: 128, height: 64 },
    ]);
    expect(imageData.width).toBe(4096);
    expect(imageData.height).toBe(2048);
    expect(imageData.path).toBe('gallery/photo.jpg@');
    expect(imageData.variations).toEqual({
      128: { path: 'gallery/photo.jpg@128', width: 128, height: 64 },
      256: { path: 'gallery/photo.jpg@256', width: 256, height: 128 },
      512: { path: 'gallery/photo.jpg@512', width: 512, height: 256 },
      1024: { path: 'gallery/photo.jpg@1024', width: 1024, height: 512 },
      2048: { path: 'gallery/photo.jpg@2048', width: 2048, height: 1024 },
    });
    expect(imageData.metadata).toEqual({
      owner: 'alice',
      width: 4096,
      height: 2048,
      space: '',
      channels: 0,
      chromaSubsampling: '',
      density: 0,
      depth: '',
      format: 'jpeg',
      hasAlpha: false,
    });
  });

  it('keeps object metadata when image metadata cannot be read', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    transformerState.metadata = null;

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'gallery/unreadable.jpg',
        contentType: 'image/jpeg',
        metadata: { owner: 'alice' },
      } as never,
    });

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'gallery/unreadable.jpg');

    expect(warnSpy).toHaveBeenCalledWith('Unable to read metadata for gallery/unreadable.jpg');
    expect(uploadMock).not.toHaveBeenCalled();
    expect(storageDocument?.data.metadata).toEqual({ owner: 'alice' });
  });

  it('stores fallback metadata for images with invalid dimensions', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    transformerState.metadata = { width: 0, height: 640, format: 'png' };

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'gallery/flat.png',
        contentType: 'image/png',
      } as never,
    });

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'gallery/flat.png');

    expect(warnSpy).toHaveBeenCalledWith('Invalid image dimensions for gallery/flat.png: 0x640');
    expect(uploadMock).not.toHaveBeenCalled();
    expect(storageDocument?.data.metadata).toEqual({
      width: 0,
      height: 640,
      space: '',
      channels: 0,
      chromaSubsampling: '',
      density: 0,
      depth: '',
      format: 'png',
      hasAlpha: false,
    });
  });

  it('removes metadata when all image variation uploads fail without object metadata', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    uploadMock.mockRejectedValueOnce(new Error('upload failed'));

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'gallery/broken.jpg',
        contentType: 'image/jpeg',
      } as never,
    });

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'gallery/broken.jpg');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to process webp format for'),
      expect.any(Error)
    );
    expect(warnSpy).toHaveBeenCalledWith('1 out of 5 image variations failed to upload');
    expect(storageDocument?.data.metadata).toBeUndefined();
  });

  it('preserves existing metadata when a repeated upload has the same metadata entries', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/repeat.txt',
        contentType: 'text/plain',
        metadata: { owner: 'alice' },
      } as never,
    });

    vi.clearAllMocks();

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/repeat.txt',
        contentType: 'text/plain',
        metadata: { owner: 'alice' },
      } as never,
    });

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'docs/repeat.txt');
    expect(storageDocument?.data.metadata).toEqual({ owner: 'alice' });
  });

  it('updates metadata when a repeated upload adds new metadata entries', async () => {
    const { handleUpload } = await import('./storage.js');
    const { StorageCollection } = await import('../../models/storage.js');

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/changed.txt',
        contentType: 'text/plain',
        metadata: { owner: 'alice' },
      } as never,
    });

    await handleUpload({
      bucket: 'test-bucket',
      data: {
        bucket: 'test-bucket',
        name: 'docs/changed.txt',
        contentType: 'text/plain',
        metadata: { owner: 'alice', tag: 'news' },
      } as never,
    });

    const storageDocument = await StorageCollection.findOneByObjectName('test-bucket', 'docs/changed.txt');
    expect(storageDocument?.data.metadata).toEqual({ owner: 'alice', tag: 'news' });
  });

  it('updates metadata for image variations on change trigger', async () => {
    const { handleChange } = await import('./storage.js');

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            name: 'photo',
            bucket: 'test-bucket',
            objectName: 'gallery/photo.jpg',
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            path: 'gallery/photo.jpg',
            directoryId: 'gallery',
            accessLevel: 2,
            active: true,
            width: 800,
            height: 600,
            variations: {
              128: { path: 'gallery/photo.jpg@128', width: 128, height: 96 },
              256: { path: 'gallery/photo.jpg@256', width: 256, height: 192 },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
    });

    expect(bucketMock).toHaveBeenCalledWith('test-bucket');
    expect(fileMock).toHaveBeenCalledWith('gallery/photo.jpg@128.webp');
    expect(fileMock).toHaveBeenCalledWith('gallery/photo.jpg@256.webp');
    expect(setMetadataMock).toHaveBeenCalledTimes(2);
    expect(setMetadataMock).toHaveBeenCalledWith({
      metadata: expect.objectContaining({
        active: 'true',
        accessLevel: '2',
        width: '800',
        height: '600',
      }),
    });
  });

  it('skips metadata sync for non-image storage documents', async () => {
    const { handleChange } = await import('./storage.js');

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            name: 'readme',
            bucket: 'test-bucket',
            objectName: 'docs/readme.txt',
            originalName: 'readme.txt',
            contentType: 'text/plain',
            path: 'docs/readme.txt',
            directoryId: 'docs',
            accessLevel: 0,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
    });

    expect(bucketMock).not.toHaveBeenCalled();
    expect(fileMock).not.toHaveBeenCalled();
    expect(setMetadataMock).not.toHaveBeenCalled();
  });

  it('ignores change events with no after snapshot', async () => {
    const { handleChange } = await import('./storage.js');

    await handleChange({});
    await handleChange({ data: { after: { exists: false, data: () => undefined } } });

    expect(bucketMock).not.toHaveBeenCalled();
    expect(fileMock).not.toHaveBeenCalled();
    expect(setMetadataMock).not.toHaveBeenCalled();
  });

  it('warns when storage change event is missing a bucket', async () => {
    const { handleChange } = await import('./storage.js');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            contentType: 'image/jpeg',
            objectName: 'gallery/photo.jpg',
            active: true,
            accessLevel: 1,
          }),
        },
      },
    });

    expect(warnSpy).toHaveBeenCalledWith('Invalid storage document: missing bucket');
    expect(bucketMock).not.toHaveBeenCalled();
  });

  it('warns when an image change has no variations to sync', async () => {
    const { handleChange } = await import('./storage.js');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            name: 'photo',
            bucket: 'test-bucket',
            objectName: 'gallery/photo.jpg',
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            path: 'gallery/photo.jpg',
            directoryId: 'gallery',
            accessLevel: 2,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
    });

    expect(warnSpy).toHaveBeenCalledWith('No variations found to update for bucket test-bucket');
    expect(bucketMock).not.toHaveBeenCalled();
  });

  it('warns when image variations are present but none are valid', async () => {
    const { handleChange } = await import('./storage.js');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            name: 'photo',
            bucket: 'test-bucket',
            objectName: 'gallery/photo.jpg',
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            path: 'gallery/photo.jpg',
            directoryId: 'gallery',
            accessLevel: 2,
            active: true,
            variations: {
              128: { path: 'gallery/photo.jpg@128', width: '128', height: 96 },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
    });

    expect(bucketMock).toHaveBeenCalledWith('test-bucket');
    expect(warnSpy).toHaveBeenCalledWith('No variations found to update for bucket test-bucket');
    expect(fileMock).not.toHaveBeenCalled();
  });

  it('warns when image variations contain non-object entries', async () => {
    const { handleChange } = await import('./storage.js');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            name: 'photo',
            bucket: 'test-bucket',
            objectName: 'gallery/photo.jpg',
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            path: 'gallery/photo.jpg',
            directoryId: 'gallery',
            accessLevel: 2,
            active: true,
            variations: {
              128: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
    });

    expect(warnSpy).toHaveBeenCalledWith('No variations found to update for bucket test-bucket');
    expect(fileMock).not.toHaveBeenCalled();
  });

  it('logs an error when metadata sync fails', async () => {
    const { handleChange } = await import('./storage.js');
    const error = new Error('metadata update failed');
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    setMetadataMock.mockRejectedValueOnce(error);

    await handleChange({
      data: {
        after: {
          exists: true,
          data: () => ({
            name: 'photo',
            bucket: 'test-bucket',
            objectName: 'gallery/photo.jpg',
            originalName: 'photo.jpg',
            contentType: 'image/jpeg',
            path: 'gallery/photo.jpg',
            directoryId: 'gallery',
            accessLevel: 2,
            active: true,
            width: 800,
            height: 600,
            variations: {
              128: { path: 'gallery/photo.jpg@128', width: 128, height: 96 },
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      },
    });

    expect(errorSpy).toHaveBeenCalledWith('Failed to update storage metadata for bucket test-bucket:', error);
  });
});
