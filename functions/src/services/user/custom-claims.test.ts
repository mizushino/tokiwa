import { describe, expect, it } from 'vitest';

import type { UserData } from '@firestore/types/user.js';

import { MAX_PROJECTS_PER_USER, ProjectLimitExceededError } from '../project/constants.js';
import { CustomClaimsTooLargeError, getCustomUserClaims } from './custom-claims.js';

function userWithProjects(projects: string[]): UserData {
  return {
    displayName: 'Test User',
    email: 'user@example.com',
    permissions: { projects },
    admin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('getCustomUserClaims', () => {
  it('accepts 30 projects with standard Firestore auto IDs', () => {
    const projects = Array.from(
      { length: MAX_PROJECTS_PER_USER },
      (_, index) => `${String(index).padStart(20, '0')}:r`
    );

    expect(getCustomUserClaims(userWithProjects(projects))).toEqual({ p: { projects }, a: false });
  });

  it('rejects more than 30 projects even when the claims payload fits within 1,000 bytes', () => {
    const projects = Array.from({ length: MAX_PROJECTS_PER_USER + 1 }, (_, index) => `p${index}:r`);

    expect(() => getCustomUserClaims(userWithProjects(projects))).toThrow(ProjectLimitExceededError);
  });

  it('rejects a claims payload larger than 1,000 bytes', () => {
    const projects = [`${'x'.repeat(1_000)}:r`];

    expect(() => getCustomUserClaims(userWithProjects(projects))).toThrow(CustomClaimsTooLargeError);
  });

  it('rejects 30 projects when longer IDs make the payload too large', () => {
    const projects = Array.from({ length: 30 }, (_, index) => `${String(index).padStart(28, 'x')}:r`);

    expect(() => getCustomUserClaims(userWithProjects(projects))).toThrow(CustomClaimsTooLargeError);
  });
});
