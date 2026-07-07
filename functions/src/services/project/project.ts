import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { projectUserDocumentPath, type ProjectUserData } from '@firestore/types/project-user.js';
import { UserDocument } from 'src/models/user.js';
import { region } from 'src/options.js';

const roleTable = new Map<string, string>([
  ['owner', 'o'],
  ['manager', 'm'],
  ['writer', 'w'],
  ['reader', 'r'],
]);

/**
 * Calculate updated project permissions for a user
 * Pure function for testing
 */
export function calculateProjectPermissions(
  currentPermissions: string[] | undefined,
  pid: string,
  projectUserData: ProjectUserData | null
): string[] {
  const projects = (currentPermissions ?? []).filter((project) => !project.startsWith(`${pid}:`));

  const roleCode = projectUserData ? roleTable.get(projectUserData.role) : undefined;
  if (roleCode) {
    projects.push(`${pid}:${roleCode}`);
  }

  return projects;
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
  const userDocument = new UserDocument({ uid });
  await userDocument.get();
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
  await updatedDocument.save();
}

/**
 * Trigger fired when a project user document is created, updated, or deleted
 * Automatically updates the permissions field in the user document
 */
export const written = onDocumentWritten({ region, document: projectUserDocumentPath }, async (event) => {
  const { projectId, uid } = event.params;
  const projectUserData = event.data?.after.data() as ProjectUserData | null;
  await updateUserPermissions(projectId, uid, projectUserData);
});
