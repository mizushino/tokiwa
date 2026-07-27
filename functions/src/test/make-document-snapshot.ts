import { getFirestore, type DocumentData, type DocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Creates a real DocumentSnapshot by writing the data to the Firestore
 * emulator and reading it back.
 *
 * Replaces firebase-functions-test's makeDocumentSnapshot, which relies on
 * the namespaced admin.firestore() API that was removed in firebase-admin
 * v14. Pass undefined or an empty object to get a snapshot of a
 * non-existent document (the document is deleted first).
 */
export async function makeDocumentSnapshot(data: object | undefined, path: string): Promise<DocumentSnapshot> {
  const ref = getFirestore().doc(path);

  if (data && Object.keys(data).length > 0) {
    await ref.set(data as DocumentData);
  } else {
    await ref.delete();
  }

  return await ref.get();
}
