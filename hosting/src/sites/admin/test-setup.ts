import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { getFirebaseConfig } from '@app/firebase-config';

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const firebaseConfig = getFirebaseConfig(env, { allowDemoFallback: true });

let initialized = false;

export async function createTestUser(): Promise<void> {
  if (initialized) {
    return;
  }

  process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  const app = getApps()[0] ?? initializeApp({ projectId: firebaseConfig.projectId });
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  let uid: string;

  try {
    const user = await auth.createUser({
      email: 'admin@playwright.test',
      password: 'mi6O4yUkNb',
      displayName: 'Playwright Admin',
      emailVerified: true,
    });
    uid = user.uid;
    console.log('Test user created successfully');
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'auth/email-already-in-use') {
      console.log('Test user already exists');
      const user = await auth.getUserByEmail('admin@playwright.test');
      uid = user.uid;
    } else {
      console.error('Error creating test user:', error);
      throw error;
    }
  }

  await auth.updateUser(uid, {
    emailVerified: true,
    displayName: 'Playwright Admin',
  });
  await auth.setCustomUserClaims(uid, { a: true });

  const now = new Date();
  await firestore.collection('users').doc(uid).set(
    {
      email: 'admin@playwright.test',
      displayName: 'Playwright Admin',
      admin: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  initialized = true;
}
