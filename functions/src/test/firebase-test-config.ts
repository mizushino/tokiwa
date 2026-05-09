export interface FirebaseTestConfig {
  projectId: string;
  storageBucket: string;
}

export function getFirebaseTestConfig(env: NodeJS.ProcessEnv = process.env): FirebaseTestConfig {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID for functions tests');
  }

  const storageBucket = env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

  return {
    projectId,
    storageBucket,
  };
}
