const DEFAULT_FIREBASE_PROJECT_ID = 'tokiwa-template';
const FIREBASE_PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;

export function getFirebaseProjectId(projectId?: string): string {
  const resolvedProjectId = projectId || DEFAULT_FIREBASE_PROJECT_ID;
  if (!FIREBASE_PROJECT_ID_PATTERN.test(resolvedProjectId)) {
    throw new Error(`Invalid FIREBASE_PROJECT_ID: ${resolvedProjectId}`);
  }
  return resolvedProjectId;
}
