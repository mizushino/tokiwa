import { describe, expect, it } from 'vite-plus/test';

import { getFirebaseProjectId } from './firebase-project-id';

describe('getFirebaseProjectId', () => {
  it('returns the default project ID when the environment value is absent', () => {
    expect(getFirebaseProjectId()).toBe('tokiwa-template');
  });

  it('accepts a valid Firebase project ID', () => {
    expect(getFirebaseProjectId('demo-project-123')).toBe('demo-project-123');
  });

  it.each([
    'UPPERCASE-project',
    'short',
    'project-ending-',
    'project name',
    'project; touch injected',
    'project$(touch-injected)',
  ])('rejects an invalid or shell-significant project ID: %s', (projectId) => {
    expect(() => getFirebaseProjectId(projectId)).toThrow(`Invalid FIREBASE_PROJECT_ID: ${projectId}`);
  });
});
