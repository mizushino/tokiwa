import * as admin from 'firebase-admin';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const setMetadataMock = vi.fn();
const fileMock = vi.fn(() => ({
  setMetadata: setMetadataMock,
}));
const bucketMock = vi.fn(() => ({
  file: fileMock,
}));

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => ({
    bucket: bucketMock,
  })),
}));

describe('storage service', () => {
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setMetadataMock.mockResolvedValue(undefined);
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
});
