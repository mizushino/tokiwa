# Functions Development Guide

This guide covers backend development with Firebase Cloud Functions.

## Directory Structure

```
functions/src/
├── models/      # Firestore document models
├── services/    # Business logic and triggers
└── types/       # Type definitions
```

## Creating a Firestore Model

Firestore document models consist of three parts: type definitions, document class, and collection class.

### Step 1: Create Type Definitions (firestore/src/types/)

First, create the type definitions in the `firestore` package:

```ts
// firestore/src/types/user/user.ts
export const userCollectionPath = 'users';
export const userDocumentPath = `${userCollectionPath}/{uid}`;

export interface UserKey {
  uid: string;
}

export interface UserData {
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'member' | 'owner';
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Points**:
- Collection and document path templates
- `Key` interface defines the document ID structure
- `Data` interface defines the document fields
- Always include `createdAt` and `updatedAt` timestamps

### Step 2: Create Document and Collection Classes (functions/src/models/)

Then create the document model in the `functions` package:

```ts
// functions/src/models/user/user.ts
import { userCollectionPath, userDocumentPath, type UserData, type UserKey } from '@firestore/types/user/user.js';
import { FirestoreCollection, FirestoreDocument, newId } from '@mzsn/firestore';

export class UserDocument extends FirestoreDocument<UserKey, UserData> {
  static pathTemplate = userDocumentPath;

  public static get defaultKey(): UserKey {
    return {
      uid: newId(),
    };
  }

  public static get defaultData(): UserData {
    const now = new Date();
    return {
      email: '',
      displayName: '',
      role: 'member',
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

**Key Points**:
- **`defaultKey`**: Static getter that returns default key values (use `newId()` for auto-generated IDs)
- **`defaultData`**: Static getter that returns default data values
- **`beforeSave()`**: Lifecycle hook to update fields before saving (e.g., `updatedAt` timestamp)
- Always extend `FirestoreDocument` and `FirestoreCollection` from `@mzsn/firestore`

### Step 3: Usage Example

```ts
import { UserDocument, UserCollection } from './models/user/user.js';

// Create a new document with default values
const userDoc = new UserDocument(
  UserDocument.defaultKey,
  UserDocument.defaultData
);

// Override specific fields
userDoc.data.email = 'user@example.com';
userDoc.data.displayName = 'John Doe';

// Save (beforeSave() will automatically update updatedAt)
await userDoc.save();

// Fetch from collection
const users = new UserCollection({});
const allUsers = await users.list();
```

### Important Conventions

- **Do NOT create custom methods** like `defaultKeyWithUid()` or `defaultDataWithEmail()`
- **Always use static getters** `defaultKey` and `defaultData` for overriding default values
- **File structure**: `firestore/src/types/{model}/{model}.ts` and `functions/src/models/{model}/{model}.ts`
- **Naming**: Use singular form (e.g., `user`, not `users`) for directory and file names
- **Timestamps**: Always include `createdAt` and `updatedAt` in data interfaces

## Data Update Pattern

### The Problem
`@mzsn/firestore`'s `UserDocument.data` property has complex getter/setter behavior. Direct mutation doesn't reliably save changes:

```ts
// ❌ BAD: Direct mutation may not save
const userDoc = new UserDocument({ uid });
await userDoc.get();
userDoc.data.permissions['projects'] = newProjects;  // May not persist!
await userDoc.save();
```

### The Solution: Immutable Pattern
Always create a new document instance with updated data:

```ts
// ✅ GOOD: Immutable pattern
const userDoc = new UserDocument({ uid });
await userDoc.get();

const updatedData = {
  ...userDoc.data,
  permissions: {
    ...userDoc.data.permissions,
    projects: newProjects,
  },
};

const updatedDoc = new UserDocument({ uid }, updatedData);
await updatedDoc.save();
```

### Why This Matters
- Ensures changes are reliably persisted
- Avoids subtle bugs in production
- All E2E tests use this pattern
- Required for testability

## Creating Triggers

### Extract Business Logic for Testability

When creating Firebase triggers, extract the core business logic into separate functions:

```ts
// ✅ GOOD: Testable structure
export async function updateUserPermissions(
  pid: string,
  uid: string,
  projectUserData: ProjectUserData | null
): Promise<void> {
  // Business logic here (fully testable)
  const userDoc = new UserDocument({ uid });
  await userDoc.get();
  
  const updatedData = {
    ...userDoc.data,
    // ... update logic
  };
  
  const updatedDoc = new UserDocument({ uid }, updatedData);
  await updatedDoc.save();
}

// Trigger is a thin wrapper
export const written = onDocumentWritten(
  { region: 'asia-northeast1', document: '/projects/{pid}/users/{uid}' },
  async (event) => {
    const pid = event.params.pid;
    const uid = event.params.uid;
    const projectUserData = event.data?.after.data() as ProjectUserData | null;
    await updateUserPermissions(pid, uid, projectUserData);
  }
);
```

### Benefits
- Business logic can be unit tested
- Trigger wrapper remains simple
- Easy to debug and maintain
- Enables E2E testing with real Firestore

## Common Patterns

### Callable Functions (HTTP/HTTPS)
```ts
export const myFunction = onCall(
  { region: 'asia-northeast1' },
  async (request): Promise<MyResponse> => {
    const { data, auth } = request;
    
    // Validate auth
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    // Business logic
    return { result: 'success' };
  }
);
```

### Document Triggers
```ts
export const onUserCreated = onDocumentCreated(
  { region: 'asia-northeast1', document: 'users/{uid}' },
  async (event) => {
    const uid = event.params.uid;
    const data = event.data?.data();
    // Handle creation
  }
);

export const onUserUpdated = onDocumentUpdated(
  { region: 'asia-northeast1', document: 'users/{uid}' },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    // Handle update
  }
);
```

### beforeUserCreated (Blocking Function)
```ts
export const created = beforeUserCreated(
  { region: 'asia-northeast1' },
  async (event) => {
    const userRecord = event.data;
    
    // Validate or modify user before creation
    // Throw error to block creation
  }
);
```

## Firebase Emulator Setup

For local development and testing:

```bash
# Start emulators
firebase emulators:start

# Emulator ports (configured in firebase.json)
# - Auth: 9099
# - Firestore: 8080
# - Functions: 5001
# - Storage: 9199
```

## Testing

See [Testing Guide](./testing.md#functions-e2e-testing) for detailed E2E testing with Firebase Emulator.
