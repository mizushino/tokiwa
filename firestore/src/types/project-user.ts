import { projectDocumentPath, type ProjectKey } from "./project.js";

export const projectUserCollectionPath = `${projectDocumentPath}/users`;
export const projectUserDocumentPath = `${projectUserCollectionPath}/{uid}`;

export interface ProjectUserKey extends ProjectKey {
  uid: string;
}

export interface ProjectUserData {
  displayName: string;
  email: string;
  image?: string;
  role: "owner" | "manager" | "writer" | "reader";
}
