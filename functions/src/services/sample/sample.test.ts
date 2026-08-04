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

  it('rejects an id other than the fixed public sample id', async () => {
    const { runHandler } = await import('./sample.js');

    await expect(runHandler({ data: { id: 'sample-1', name: 'Alice' } })).rejects.toBeInstanceOf(HttpsError);
    await expect(runHandler({ data: { id: 'sample-1', name: 'Alice' } })).rejects.toMatchObject({
      message: 'id must be sample',
    });
  });

  it('rejects blank name', async () => {
    const { runHandler } = await import('./sample.js');

    await expect(runHandler({ data: { id: 'sample', name: '   ' } })).rejects.toBeInstanceOf(HttpsError);
    await expect(runHandler({ data: { id: 'sample', name: '   ' } })).rejects.toMatchObject({
      message: 'name is required',
    });
  });

  it('rejects names longer than the Firestore Rules limit', async () => {
    const { runHandler } = await import('./sample.js');

    await expect(runHandler({ data: { id: 'sample', name: 'a'.repeat(101) } })).rejects.toMatchObject({
      message: 'name must be at most 100 characters',
    });
  });

  it('creates a sample document on first run', async () => {
    const { runHandler } = await import('./sample.js');
    const { SampleDocument } = await import('../../models/sample.js');

    const result = await runHandler({
      data: { id: ' sample ', name: ' Alice ' },
    });

    expect(result).toEqual({
      id: 'sample',
      name: 'Alice',
      count: 1,
    });

    const savedDocument = new SampleDocument({ id: 'sample' });
    await savedDocument.get();

    expect(savedDocument.exists).toBe(true);
    expect(savedDocument.data.name).toBe('Alice');
    expect(savedDocument.data.count).toBe(1);
  });

  it('updates an existing sample document and increments count', async () => {
    const { runHandler } = await import('./sample.js');
    const { SampleDocument } = await import('../../models/sample.js');

    const existingDocument = new SampleDocument(
      { id: 'sample' },
      {
        ...SampleDocument.defaultData,
        name: 'Before',
        count: 3,
      }
    );
    await existingDocument.save();

    const result = await runHandler({
      data: { id: 'sample', name: ' After ' },
    });

    expect(result).toEqual({
      id: 'sample',
      name: 'After',
      count: 4,
    });

    const savedDocument = new SampleDocument({ id: 'sample' });
    await savedDocument.get();

    expect(savedDocument.exists).toBe(true);
    expect(savedDocument.data.name).toBe('After');
    expect(savedDocument.data.count).toBe(4);
  });

  it('preserves every increment from concurrent requests', async () => {
    const { runHandler } = await import('./sample.js');
    const { SampleDocument } = await import('../../models/sample.js');
    const requestCount = 10;

    const results = await Promise.all(
      Array.from({ length: requestCount }, () =>
        runHandler({
          data: { id: 'sample', name: 'Concurrent' },
        })
      )
    );

    const savedDocument = new SampleDocument({ id: 'sample' });
    await savedDocument.get();

    expect(savedDocument.data.count).toBe(requestCount);
    expect(results.map((result) => result.count).toSorted((a, b) => a - b)).toEqual(
      Array.from({ length: requestCount }, (_, index) => index + 1)
    );
  });
});
