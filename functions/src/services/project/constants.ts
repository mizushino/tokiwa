export const MAX_PROJECTS_PER_USER = 30;

export class ProjectLimitExceededError extends Error {
  public readonly code = 'auth/invalid-claims';

  public constructor() {
    super(`A user cannot belong to more than ${MAX_PROJECTS_PER_USER} projects.`);
    this.name = 'ProjectLimitExceededError';
  }
}
