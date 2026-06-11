import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { getFirebaseConfig } from './src/app/firebase-config';

async function globalSetup(): Promise<void> {
  console.log('Global setup: Waiting for Firebase Emulator to be ready...');

  // Wait for emulator to be ready
  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch('http://localhost:9099');
      if (response.ok || response.status === 404) {
        console.log('Firebase Emulator is ready!');
        break;
      }
    } catch (_error: unknown) {
      // Emulator not ready yet
    }

    retries++;
    if (retries >= maxRetries) {
      throw new Error('Firebase Emulator failed to start within timeout');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const firebaseConfig = getFirebaseConfig(process.env, { allowDemoFallback: true });
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
}

export default globalSetup;
