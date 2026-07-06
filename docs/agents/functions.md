# Functions Development Guide

This guide covers backend development with Firebase Cloud Functions.

## Directory Structure

```
functions/src/
├── index.ts              # Namespace exports for deployed functions
├── models/               # Firestore document and collection classes
├── services/             # Trigger handlers and callable handlers
├── test/                 # Shared test helpers
├── test-setup.ts         # Vitest global setup
└── types/                # Callable request/response types
```

### Current Layout Conventions

- Firestore shared types live in `firestore/src/types/*.ts` as flat files such as `user.ts` or `project-user.ts`
- Functions models live in `functions/src/models/*.ts` as flat files such as `user.ts` or `sample.ts`
- Trigger and callable implementations are grouped by domain under `functions/src/services/{domain}/{domain}.ts`
- Tests are colocated with service modules as `*.test.ts`

## Creating a Firestore Model

Firestore-backed features usually span three layers:

1. Shared type definitions in `firestore/src/types/*.ts`
2. Server-side models in `functions/src/models/*.ts`
3. Optional matching client-side models in `hosting/src/models/*.ts` when the client reads the same collection directly

### Step 1: Add Shared Types

```ts
// firestore/src/types/user.ts
export const userCollectionPath = 'users';
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
```

### Step 2: Add the Server Model

```ts
// functions/src/models/user.ts
import { FirestoreCollection, FirestoreDocument } from '@mzsn/firestore';

import { userCollectionPath, userDocumentPath, type UserData, type UserKey } from '@firestore/types/user.js';

export class UserDocument extends FirestoreDocument<UserKey, UserData> {
  static pathTemplate = userDocumentPath;

  public static get defaultKey(): UserKey {
    return {
      uid: '',
    };
  }

  public static get defaultData(): UserData {
    const now = new Date();
    return {
      email: '',
      displayName: '',
      image: '',
      permissions: {},
      admin: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  protected override beforeSave(): void {
    const now = new Date();
    this.data.createdAt ??= now;
    this.data.updatedAt = now;
  }
}

export class UserCollection extends FirestoreCollection<never, UserKey, UserData, UserDocument> {
  static pathTemplate = userCollectionPath;
  static documentClass = UserDocument;
}
```

### Important Conventions

- Use flat file paths such as `firestore/src/types/user.ts` and `functions/src/models/user.ts`
- Keep `defaultKey` aligned with the actual ID source; for auth-backed documents, the UID usually comes from Auth rather than `newId()`
- Keep `defaultData` complete enough to build a valid first write
- Use `beforeSave()` for timestamps and other consistently derived fields

## Data Update Pattern

Avoid mutating nested document state in place. Create a new document instance with merged data.

```ts
const userDocument = new UserDocument({ uid });
await userDocument.get();

const updatedData = {
  ...userDocument.data,
  permissions: {
    ...(userDocument.data.permissions || {}),
    projects: nextProjects,
  },
};

const updatedDocument = new UserDocument({ uid }, updatedData);
await updatedDocument.save();
```

This pattern is used by the current project trigger logic and should remain the default.

## Creating Services

### Trigger Structure

Keep exported triggers thin and move the real business logic into named functions that tests can call directly.

```ts
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

  const updatedDocument = new UserDocument({ uid }, {
    ...userDocument.data,
    permissions: {
      ...(userDocument.data.permissions || {}),
      projects: calculateProjectPermissions(
        userDocument.data.permissions?.projects,
        pid,
        projectUserData
      ),
    },
  });

  await updatedDocument.save();
}

export const written = onDocumentWritten(
  { region: 'asia-northeast1', document: '/projects/{pid}/users/{uid}' },
  async (event) => {
    await updateUserPermissions(
      event.params.pid,
      event.params.uid,
      event.data?.after.data() as ProjectUserData | null
    );
  }
);
```

### Callable Functions

Place request and response types in `functions/src/types/*.ts` and keep the callable wrapper small.

```ts
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import type { SampleRunRequest, SampleRunResponse } from 'src/types/sample.js';

export async function runHandler(request: { data: SampleRunRequest }): Promise<SampleRunResponse> {
  const id = request.data.id.trim();

  if (!id) {
    throw new HttpsError('invalid-argument', 'id is required');
  }

  return {
    id,
    name: request.data.name.trim(),
    count: 1,
  };
}

export const run = onCall<SampleRunRequest, Promise<SampleRunResponse>>(
  { region: 'asia-northeast1' },
  runHandler
);
```

### Blocking Auth Triggers

Use `beforeUserCreated()` when user creation needs to seed Firestore or inherit pre-registered permissions before the account becomes active.

## Export Structure

The root `functions/src/index.ts` exports domains as namespaces:

```ts
export * as user from './services/user/user.js';
export * as project from './services/project/project.js';
export * as storage from './services/storage/storage.js';
```

Follow the same pattern for new service domains so deployment output stays predictable.

## Local Development and Testing

Use Node.js 24.

```bash
nvm use
cd functions
npm run test
```

Repository-level scripts are also available from the root:

```bash
npm run test:functions
npm run coverage:functions
```

See [Testing Guide](./testing.md#functions-testing) for test details.
