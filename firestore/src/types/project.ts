export const projectCollectionPath = "projects";
export const projectDocumentPath = `${projectCollectionPath}/{projectId}`;

export interface ProjectKey {
  projectId: string;
}

export interface ProjectData {
  name: string;
  code: string;
}
