import { getFirestore, type Transaction } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { projectUserDocumentPath, type ProjectUserData } from '@firestore/types/project-user.js';
import { UserDocument } from 'src/models/user.js';
import { region } from 'src/options.js';

import { CustomClaimsTooLargeError, getCustomUserClaims } from '../user/custom-claims.js';
import { MAX_PROJECTS_PER_USER, ProjectLimitExceededError } from './constants.js';

export { MAX_PROJECTS_PER_USER, ProjectLimitExceededError } from './constants.js';

const roleTable = new Map<string, string>([
  ['owner', 'o'],
  ['manager', 'm'],
  ['writer', 'w'],
  ['reader', 'r'],
]);

export class InvalidProjectIdError extends Error {
  public constructor() {
    super('Project IDs cannot contain a colon.');
    this.name = 'InvalidProjectIdError';
  }
}

/**
 * Calculate updated project permissions for a user
 * Pure function for testing
 */
export function calculateProjectPermissions(
  currentPermissions: string[] | undefined,
  pid: string,
  projectUserData: ProjectUserData | null
): string[] {
  if (projectUserData && pid.includes(':')) {
    throw new InvalidProjectIdError();
  }

  const currentProjectPermissions = new Set([...roleTable.values()].map((roleCode) => `${pid}:${roleCode}`));
  const projects = (currentPermissions ?? []).filter((project) => !currentProjectPermissions.has(project));

  const roleCode = projectUserData ? roleTable.get(projectUserData.role) : undefined;
  if (roleCode) {
    if (projects.length >= MAX_PROJECTS_PER_USER) {
      throw new ProjectLimitExceededError();
    }
    projects.push(`${pid}:${roleCode}`);
  }

  return projects;
}

async function updateUserPermissionsInTransaction(
  transaction: Transaction,
  pid: string,
  uid: string,
  projectUserData: ProjectUserData | null
): Promise<void> {
  const userDocument = new UserDocument({ uid });
  await userDocument.get(transaction);
  if (!userDocument.exists) {
    return;
  }

  const permissions = userDocument.data.permissions ?? {};
  const updatedDocument = new UserDocument(
    { uid },
    {
      ...userDocument.data,
      permissions: {
        ...permissions,
        projects: calculateProjectPermissions(permissions.projects, pid, projectUserData),
      },
    }
  );
  getCustomUserClaims(updatedDocument.data);
  await updatedDocument.save(false, transaction);
}

/**
 * Update user permissions based on project user changes
 * Exported for testing purposes
 */
export async function updateUserPermissions(
  pid: string,
  uid: string,
  projectUserData: ProjectUserData | null
): Promise<void> {
  await getFirestore().runTransaction(async (transaction) => {
    await updateUserPermissionsInTransaction(transaction, pid, uid, projectUserData);
  });
}

/**
 * Re-read the current membership before projecting it to the user document.
 * This keeps delayed or retried events from restoring stale permissions.
 */
export async function syncCurrentProjectPermission(pid: string, uid: string): Promise<void> {
  const firestore = getFirestore();
  const membershipReference = firestore.doc(`projects/${pid}/users/${uid}`);

  const rejectionMessage = await firestore.runTransaction(async (transaction) => {
    const membership = await transaction.get(membershipReference);
    const projectUserData = membership.exists ? (membership.data() as ProjectUserData) : null;
    try {
      await updateUserPermissionsInTransaction(transaction, pid, uid, projectUserData);
      return null;
    } catch (error) {
      if (
        membership.exists &&
        (error instanceof ProjectLimitExceededError ||
          error instanceof CustomClaimsTooLargeError ||
          error instanceof InvalidProjectIdError)
      ) {
        transaction.delete(membershipReference);
        return error.message;
      }
      throw error;
    }
  });

  if (rejectionMessage) {
    logger.warn(`Removed project membership projects/${pid}/users/${uid}: ${rejectionMessage}`);
  }
}

/**
 * Trigger fired when a project user document is created, updated, or deleted
 * Automatically updates the permissions field in the user document
 */
export const written = onDocumentWritten({ region, document: projectUserDocumentPath, retry: true }, async (event) => {
  const { projectId, uid } = event.params;
  await syncCurrentProjectPermission(projectId, uid);
});
