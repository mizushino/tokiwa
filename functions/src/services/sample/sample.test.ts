import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

describe('sample service E2E', () => {
  let db: Firestore;

  beforeAll(() => {
    if (!getApps().length) {
      initializeApp();
    }
    db = getFirestore();
  });

  afterEach(async () => {
    const snapshot = await db.collection('samples').get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });

  it('rejects blank id', async () => {
    const { runHandler } = await import('./sample.js');

    await expect(runHandler({ data: { id: '   ', name: 'Alice' } })).rejects.toBeInstanceOf(HttpsError);
    await expect(runHandler({ data: { id: '   ', name: 'Alice' } })).rejects.toMatchObject({
      message: 'id is required',
    });
  });

  it('rejects blank name', async () => {
    const { runHandler } = await import('./sample.js');

    await expect(runHandler({ data: { id: 'sample-1', name: '   ' } })).rejects.toBeInstanceOf(HttpsError);
    await expect(runHandler({ data: { id: 'sample-1', name: '   ' } })).rejects.toMatchObject({
      message: 'name is required',
    });
  });

  it('creates a sample document on first run', async () => {
    const { runHandler } = await import('./sample.js');
    const { SampleDocument } = await import('../../models/sample.js');

    const result = await runHandler({
      data: { id: ' sample-1 ', name: ' Alice ' },
    });

    expect(result).toEqual({
      id: 'sample-1',
      name: 'Alice',
      count: 1,
    });

    const savedDocument = new SampleDocument({ id: 'sample-1' });
    await savedDocument.get();

    expect(savedDocument.exists).toBe(true);
    expect(savedDocument.data.name).toBe('Alice');
    expect(savedDocument.data.count).toBe(1);
  });

  it('updates an existing sample document and increments count', async () => {
    const { runHandler } = await import('./sample.js');
    const { SampleDocument } = await import('../../models/sample.js');

    const existingDocument = new SampleDocument(
      { id: 'sample-2' },
      {
        ...SampleDocument.defaultData,
        name: 'Before',
        count: 3,
      }
    );
    await existingDocument.save();

    const result = await runHandler({
      data: { id: 'sample-2', name: ' After ' },
    });

    expect(result).toEqual({
      id: 'sample-2',
      name: 'After',
      count: 4,
    });

    const savedDocument = new SampleDocument({ id: 'sample-2' });
    await savedDocument.get();

    expect(savedDocument.exists).toBe(true);
    expect(savedDocument.data.name).toBe('After');
    expect(savedDocument.data.count).toBe(4);
  });
});
