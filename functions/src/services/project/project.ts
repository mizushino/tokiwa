import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import type { ProjectUserData } from '@firestore/types/project-user.js';
import { UserDocument } from 'src/models/user.js';

export const roleTable = new Map<string, string>([
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
  const projects = (currentPermissions || []).filter((project) => !project.startsWith(`${pid}:`));

  if (projectUserData && roleTable.has(projectUserData.role)) {
    projects.push(`${pid}:${roleTable.get(projectUserData.role)}`);
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
  const userDocument = new UserDocument({ uid: uid });
  await userDocument.get();
  if (!userDocument.exists) {
    return;
  }

  const currentPermissions = userDocument.data.permissions || { projects: [] };
  const currentProjects = currentPermissions['projects'] || [];

  const newProjects = calculateProjectPermissions(currentProjects, pid, projectUserData);

  const updatedData = {
    ...userDocument.data,
    permissions: {
      ...currentPermissions,
      projects: newProjects,
    },
  };

  const updatedDocument = new UserDocument({ uid }, updatedData);
  await updatedDocument.save();
}

/**
 * Trigger fired when a project user document is created, updated, or deleted
 * Automatically updates the permissions field in the user document
 */
export const written = onDocumentWritten(
  { region: 'asia-northeast1', document: '/projects/{pid}/users/{uid}' },
  async (event) => {
    const pid = event.params.pid;
    const uid = event.params.uid;
    const projectUserData = event.data?.after.data() as ProjectUserData | null;
    await updateUserPermissions(pid, uid, projectUserData);
  }
);
