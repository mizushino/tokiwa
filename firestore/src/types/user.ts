export const userCollectionPath = "users";
export const userDocumentPath = `${userCollectionPath}/{uid}`;

export interface UserKey {
  uid: string;
}

export interface UserData {
  displayName: string;
  email: string;
  image?: string;
  permissions?: { [key: string]: string[] };
  admin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
