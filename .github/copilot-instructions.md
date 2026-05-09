# Copilot Instructions

## Response Language

- Think internally in English
- Always respond in Japanese (the user is Japanese)

---

## Project Overview

Firebase-based multi-site web application framework using Lit Web Components, Tailwind CSS v4, and TypeScript.

### Project Structure

```
/
├── hosting/              # Frontend (Lit + Tailwind + Vite)
│   └── src/
│       ├── app/         # Core: auth, navigation, base classes
│       ├── sites/       # Multi-site: default, admin
│       ├── components/  # Reusable UI components
│       ├── models/      # Client-side Firestore models
│       └── services/    # Functions API clients
├── functions/            # Cloud Functions backend
│   └── src/
│       ├── models/      # Server-side Firestore models
│       ├── services/    # Triggers and business logic
│       └── types/       # Type definitions
├── firestore/            # Shared types and rules
│   └── src/types/       # Shared type definitions (Key + Data interfaces)
└── storage/              # Storage rules
```

### Architecture: Client-First Data Flow

1. **Primary**: Direct Firestore access with Security Rules
2. **Secondary**: Cloud Functions triggers for side effects
3. **Last Resort**: Callable functions for complex operations

---

## Critical Patterns

### 1. LightElement for Tailwind CSS

Components using Tailwind MUST extend `LightElement` (not `LitElement`):

```typescript
import { LightElement } from '@app/element';

@customElement('my-component')
export class MyComponent extends LightElement {
  protected static override hostClasses = ['flex', 'items-center'];
  
  protected override render() {
    return html`<div class="text-gray-900">Content</div>`;
  }
}
```

### 2. PageElement for Pages

All pages extend `PageElement` with required metadata:

```typescript
import { PageElement } from '@app/page';
import pageMetadata from './page.json';

@customElement('admin-dashboard')
export class AdminDashboard extends PageElement {
  protected pageMetadata = pageMetadata;
  // Component naming: {site}-{page-name}
}
```

### 3. Firestore Model Pattern

Types in `firestore/`, models in both `hosting/` and `functions/`:

```typescript
// firestore/src/types/user.ts - Shared types
export interface UserKey { uid: string; }
export interface UserData { email: string; displayName: string; /* ... */ }

// functions/src/models/user.ts - Server model
export class UserDocument extends FirestoreDocument<UserKey, UserData> {
  static pathTemplate = userDocumentPath;
  public static get defaultKey(): UserKey { return { uid: newId() }; }
  public static get defaultData(): UserData { /* ... */ }
}
```

### 4. Reactive Auth with AsyncGenerator

Use `userSnapshot()` with `track()` for reactive auth:

```typescript
protected user = userSnapshot();

render() {
  return html`${track(this.user, (user) => 
    user ? html`Welcome!` : html`Please sign in`
  )}`;
}
```

### 5. Immutable Firestore Updates

Always create new document instances for updates:

```typescript
// ✅ Correct
const updatedDoc = new UserDocument({ uid }, { ...userDoc.data, email: newEmail });
await updatedDoc.save();

// ❌ Wrong: Direct mutation may not persist
userDoc.data.email = newEmail;
await userDoc.save();
```

---

## Quick Reference

### Tailwind CSS v4 Syntax

| Modern (v4) | Legacy |
|-------------|--------|
| `bg-linear-to-br` | `bg-gradient-to-br` |
| `shrink-0` | `flex-shrink-0` |
| `dark:scheme-dark` | `dark:[color-scheme:dark]` |

### Modal API

```typescript
import { Modal } from '@components/ui/modal';

await Modal.success('Saved');
await Modal.error('Failed');
const confirmed = await Modal.confirm('Delete?', 'This cannot be undone', 'danger');
```

### Node.js Version Requirement

This project requires **Node.js 24** (specified in `functions/package.json` and `.nvmrc`).

**Using nvm (recommended for local development):**
```bash
cd /path/to/project
nvm use  # Reads .nvmrc and switches to Node 24
```

> ⚠️ **Important**: Each terminal session requires `nvm use`. New terminals default to your nvm default version, not the project's `.nvmrc`.

**Without nvm:**
If Node.js 24+ is installed system-wide, nvm is not required. Verify with:
```bash
node -v  # Should be v24.x.x or higher
```

### Development Commands

| Command | Description |
|---------|-------------|
| `nvm use` | Switch to project's Node.js version (if using nvm) |
| `cd hosting && APP_SITE=admin npm run dev` | Dev server (admin site) |
| `cd hosting && npm run test` | Component tests |
| `cd hosting && npm run test:e2e` | Playwright E2E tests |
| `cd functions && npm run test` | Functions E2E tests |
| `firebase emulators:start` | Start Firebase Emulators |

### Code Verification (CRITICAL)

**Always run lint and build from the root directory:**

```bash
cd /path/to/<project>  # Root directory (NOT hosting/ or functions/)
npm run lint && npm run build
```

This ensures ALL packages (hosting + functions) are checked. Running from subdirectories will miss errors in other packages.

---

## Detailed Guides

| Guide | Description |
|-------|-------------|
| [Hosting Guide](./docs/hosting.md) | Pages, routing, components |
| [Functions Guide](./docs/functions.md) | Models, triggers, services |
| [Testing Guide](./docs/testing.md) | Component, E2E, and Functions testing |
| [Design Guide](./docs/design.md) | Tailwind CSS v4, UI consistency, and design rules |
| [Conventions](./docs/conventions.md) | Code style (English only) |
| [Commit Guide](./docs/commit.md) | Git commit message format |
