# Agent Instructions

> This file is the single source of truth for all coding agents (Claude Code, Codex, Copilot, etc.).
> Tool-specific entry files (`CLAUDE.md`, `.github/copilot-instructions.md`, …) point here.

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

Use `subscribeUserState()` for auth state (`undefined` = loading, `null` = signed out), and use Firestore subscriptions from hosting models for permission-sensitive UI. Unsubscribe in `disconnectedCallback()`.

```typescript
@state()
protected currentUser: User | null | undefined = undefined;

private unsubscribeAuthState?: Unsubscribe;

public override connectedCallback(): void {
  super.connectedCallback();
  this.unsubscribeAuthState = subscribeUserState((user) => {
    this.currentUser = user;
  });
}

public override disconnectedCallback(): void {
  super.disconnectedCallback();
  this.unsubscribeAuthState?.();
  this.unsubscribeAuthState = undefined;
}

protected override render(): TemplateResult {
  return html`${this.currentUser ? html`Welcome!` : html`Please sign in`}`;
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

This project supports Node.js 24 and 26.

```bash
cd /path/to/project
nvm use
node -v
```

### npm Workspaces

The repository is a single npm workspace with two member packages: `hosting` and `functions`. `firestore/` is not a package; it is shared source referenced through the `@firestore/*` path alias.

- Always run `npm install` from the repository root; there is one root `package-lock.json` and no per-package lockfiles
- Add a dependency to a specific package with `npm install <pkg> -w hosting` or `npm install <pkg> -w functions`
- `overrides` only takes effect in the root `package.json`; never add it to member packages
- `functions/` ships as a self-contained bundle (`lib/index.cjs`); only the packages listed in its `dependencies` are installed by Firebase on deploy, resolved from version ranges since there is no package-level lockfile

### Development Commands

| Command | Description |
|---------|-------------|
| `nvm use` | Switch to the project's Node.js version |
| `npm run dev:default` | Start the default site in dev mode |
| `npm run dev:admin` | Start the admin site in dev mode |
| `npm run build` | Build hosting (current `APP_SITE`) and functions |
| `npm run build:default` / `npm run build:admin` | Build one hosting site |
| `npm run fmt` | Format all sources (hosting, functions, firestore, storage) with oxfmt |
| `npm run lint` | Lint hosting (oxlint + lit-analyzer) and functions |
| `npm run test` | Run hosting and functions tests |
| `npm run test:hosting` / `npm run test:functions` | Run one package's tests |
| `npm run e2e` | Run Playwright tests for hosting |
| `npm run e2e:ui` | Run Playwright tests in UI mode |
| `npm run emulators` | Start Firebase emulators from `.artifacts/firebase` |

### Code Verification

After writing or modifying source code, always format it, then run verification from the repository root so both packages are checked.

```bash
cd /path/to/<project>
npm run fmt && npm run lint && npm run build
```

When the change is test-related, prefer the narrowest matching root or package script before widening scope.

---

## Detailed Guides

| Guide | Description |
|-------|-------------|
| [Hosting Guide](./docs/agents/hosting.md) | Pages, routing, components, client-side data access |
| [Functions Guide](./docs/agents/functions.md) | Models, triggers, callable handlers, backend structure |
| [Testing Guide](./docs/agents/testing.md) | Vitest, Playwright, emulator-based functions tests |
| [Design Guide](./docs/agents/design.md) | Tailwind CSS v4, UI consistency, and styling rules |
| [Conventions](./docs/agents/conventions.md) | Code style and repository conventions |
| [Commit Guide](./docs/agents/commit.md) | Git commit message format |
