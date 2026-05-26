# Copilot Instructions

## Response Language

- Think internally in English
- Always respond in Japanese (the user is Japanese)

---

## Project Overview

Firebase-based multi-site web application framework using Lit, Tailwind CSS v4, TypeScript, Firestore, and Firebase Cloud Functions.

### Project Structure

```
/
├── hosting/               # Frontend (Lit + Tailwind + Vite)
│   ├── public/            # Site entry HTML and built assets
│   └── src/
│       ├── app/           # Core: auth, element base classes, functions, i18n, page, transition
│       ├── components/    # Reusable UI components
│       ├── models/        # Client-side Firestore models
│       ├── services/      # Callable Functions clients
│       ├── sites/         # Site-specific pages and routers (default, admin)
│       └── test/          # Test utilities
├── functions/             # Cloud Functions backend
│   └── src/
│       ├── models/        # Server-side Firestore models
│       ├── services/      # Triggers and callable handlers
│       ├── test/          # Test helpers
│       └── types/         # Callable request/response types
├── firestore/             # Shared Firestore types and rules
│   └── src/types/         # Flat shared type definitions
└── storage/               # Storage rules
```

### Architecture: Client-First Data Flow

1. Primary: direct Firestore access with Security Rules
2. Secondary: Cloud Functions triggers for side effects and sync
3. Last resort: callable functions for operations that cannot be expressed safely on the client

---

## Critical Patterns

### 1. Tailwind Styles via `tailwindCSS`

Tailwind is shared through `tailwindCSS`, a constructable CSSStyleSheet exported from `@app/styles`. Include it in the component's `static styles` to inject Tailwind into Shadow DOM.

```typescript
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { tailwindCSS } from '@app/styles';

@customElement('ui-example-card')
export class UiExampleCard extends LitElement {
  static override styles = [tailwindCSS];

  protected override render() {
    return html`<div class="rounded-lg border p-4">Content</div>`;
  }
}
```

### 2. PageElement for Pages

Pages extend `PageElement` for metadata, translations, and navigation helpers.

```typescript
import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PageElement } from '@app/page';

import pageMetadata from './page.json';

@customElement('default-helloworld')
export class DefaultHelloWorld extends PageElement {
  protected pageMetadata = pageMetadata;

  protected override render(): TemplateResult {
    return html`<h1>Hello, World!</h1>`;
  }
}
```

### 3. Firestore Model Pattern

Shared document types live in `firestore/src/types/*.ts`. Matching models may exist in both `hosting/src/models/*.ts` and `functions/src/models/*.ts` when the same collection is accessed from both client and server.

```typescript
// firestore/src/types/user.ts
export interface UserKey {
  uid: string;
}

export interface UserData {
  displayName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// functions/src/models/user.ts
export class UserDocument extends FirestoreDocument<UserKey, UserData> {
  static pathTemplate = userDocumentPath;

  public static get defaultKey(): UserKey {
    return { uid: '' };
  }
}
```

### 4. Reactive Auth and Realtime Reads

Use `userSnapshot()` with `track()` for auth state, and use Firestore subscriptions from hosting models for permission-sensitive UI.

```typescript
protected user = userSnapshot();

protected override render(): TemplateResult {
  return html`${track(this.user, (user) => {
    return user ? html`Welcome!` : html`Please sign in`;
  })}`;
}
```

### 5. Immutable Firestore Updates

When updating Firestore-backed documents, create a new document instance with merged data instead of mutating nested state in place.

```typescript
const updatedDoc = new UserDocument(
  { uid },
  { ...userDoc.data, permissions: { ...userDoc.data.permissions, projects: nextProjects } }
);
await updatedDoc.save();
```

---

## Quick Reference

### Tailwind CSS v4 Syntax

| Modern (v4) | Legacy |
|-------------|--------|
| `bg-linear-to-br` | `bg-gradient-to-br` |
| `shrink-0` | `flex-shrink-0` |
| `dark:scheme-dark` | `dark:[color-scheme:dark]` |

### Node.js Version Requirement

This project requires Node.js 24.

```bash
cd /path/to/project
nvm use
node -v
```

### Development Commands

| Command | Description |
|---------|-------------|
| `nvm use` | Switch to the project's Node.js version |
| `npm run dev:default` | Start the default site in dev mode |
| `npm run dev:admin` | Start the admin site in dev mode |
| `npm run test` | Run hosting and functions tests |
| `npm run test:e2e` | Run Playwright tests for hosting |
| `npm run coverage` | Run coverage for hosting and functions |
| `npm run emulators` | Start Firebase emulators from `.artifacts/firebase` |

### Code Verification

Run verification from the repository root so both packages are checked.

```bash
cd /path/to/<project>
npm run lint && npm run build
```

When the change is test-related, prefer the narrowest matching root or package script before widening scope.

---

## Detailed Guides

| Guide | Description |
|-------|-------------|
| [Hosting Guide](./docs/hosting.md) | Pages, routing, components, client-side data access |
| [Functions Guide](./docs/functions.md) | Models, triggers, callable handlers, backend structure |
| [Testing Guide](./docs/testing.md) | Vitest, Playwright, emulator-based functions tests |
| [Design Guide](./docs/design.md) | Tailwind CSS v4, UI consistency, and styling rules |
| [Conventions](./docs/conventions.md) | Code style and repository conventions |
| [Commit Guide](./docs/commit.md) | Git commit message format |
