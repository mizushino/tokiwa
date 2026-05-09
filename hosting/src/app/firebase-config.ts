import type { FirebaseOptions } from 'firebase/app';

type FirebaseEnv = Record<string, string | undefined>;

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const DEFAULT_TEMPLATE_PROJECT_ID = 'demo-tokiwa-template';

interface FirebaseConfigOptions {
  allowDemoFallback?: boolean;
}

function requireEnv(env: FirebaseEnv, key: keyof FirebaseOptions extends string ? string : never): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing Firebase config: ${key}`);
  }
  return value;
}

function createDemoFirebaseConfig(env: FirebaseEnv): FirebaseOptions {
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || DEFAULT_TEMPLATE_PROJECT_ID;

  return {
    apiKey: env.VITE_FIREBASE_API_KEY || `demo-api-key-${projectId}`,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
    appId: env.VITE_FIREBASE_APP_ID || `1:000000000000:web:${projectId}`,
  };
}

export function getFirebaseConfig(env: FirebaseEnv, options?: FirebaseConfigOptions): FirebaseOptions {
  const hasExplicitConfig = REQUIRED_KEYS.every((key) => Boolean(env[key]));

  if (!hasExplicitConfig) {
    if (options?.allowDemoFallback) {
      return createDemoFirebaseConfig(env);
    }

    const missingKeys = REQUIRED_KEYS.filter((key) => !env[key]);
    throw new Error(`Missing Firebase config: ${missingKeys.join(', ')}`);
  }

  return {
    apiKey: requireEnv(env, 'VITE_FIREBASE_API_KEY'),
    authDomain: requireEnv(env, 'VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv(env, 'VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv(env, 'VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv(env, 'VITE_FIREBASE_APP_ID'),
    ...(env.VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID } : {}),
  };
}
