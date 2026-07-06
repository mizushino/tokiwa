# Hosting Development Guide

This guide covers frontend development with Lit, Tailwind CSS, and Firebase.

Use this guide for implementation concerns such as project structure, routing, page setup, component architecture, and frontend data flow.

For visual rules, Tailwind styling decisions, design consistency, accessibility expectations, and theme-token usage, see [Design Guide](./design.md).

## Directory Structure

```
hosting/
├── public/              # Site entry HTML and generated assets
├── src/
│   ├── app/             # Core app modules
│   ├── components/      # Shared UI components
│   ├── models/          # Firestore access from the client
│   ├── services/        # Callable Functions clients
│   ├── sites/           # Site routers and page components
│   └── test/            # Test helpers
├── global-setup.ts      # Playwright global setup
├── playwright.config.ts
└── vite.config.ts
```

### Key Directories

#### `src/app/`
Contains reusable application primitives:
- `auth/`: Firebase Authentication helpers and `userSnapshot()`
- `styles/`: `tailwindCSS`, a constructable CSSStyleSheet for injecting Tailwind into Shadow DOM
- `functions/`: Firebase Functions initialization and callable wrappers
- `i18n/`: language detection and shared translations
- `page/`: `PageElement`, metadata handling, and navigation helpers
- `transition/`: transition directive utilities

#### `src/sites/`
Contains site-specific routers and pages:
- `default/`: public example site
- `admin/`: admin site with auth and permission gating
- each site has a root `index.ts` router component and a root `page.json`
- nested folders such as `helloworld/`, `buttons/`, or `firestore/` map to route segments and usually contain `index.ts`, `page.json`, and optional `*.spec.ts`

#### `src/components/ui/`
Reusable components shared across sites. Current UI components include button, checkbox, dialog, dropdown, modal, sidebar, split, and table.

#### `src/models/`
Client-side Firestore models and subscriptions, for example `subscribeToUserDocument()` and Firestore document classes built on `@mzsn/firestore/web`.

#### `src/services/`
Typed clients for callable Functions. The current pattern is a thin wrapper around `callFirebaseFunction()`.

## Creating a New Page

Pages are added under a site's folder and registered manually in that site's router.

### Directory Structure

```
hosting/src/sites/{site-name}/{path}/
├── index.ts
├── page.json
└── {optional} {name}.spec.ts
```

### Step 1: Create `page.json`

```json
{
  "title": "Hello, World!",
  "description": "A simple example page for the default site."
}
```

`PageElement` also supports optional `translations` for page-local strings.

### Step 2: Create `index.ts`

```ts
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

declare global {
  interface HTMLElementTagNameMap {
    'default-helloworld': DefaultHelloWorld;
  }
}
```

### Key Points

- Follow the custom element naming pattern `{site}-{page-name}` such as `default-helloworld` or `admin-buttons`
- Import `PageElement` from `@app/page`
- Import `page.json` and assign it to `pageMetadata`
- Add the element to `HTMLElementTagNameMap`
- Keep the folder structure aligned with the route segment you will register manually

### Step 3: Register the Route

Register the page in the site router, usually `hosting/src/sites/{site}/index.ts`.

```ts
import './helloworld';

protected routes = new Routes(
  this,
  [
    {
      path: 'helloworld/',
      render: () => html`<default-helloworld></default-helloworld>`,
    },
  ]
);
```

There is no automatic route discovery in the current codebase.

## Key Patterns

### tailwindCSS and Tailwind

Most components render with Shadow DOM and include Tailwind via `tailwindCSS`.

```ts
import { html, LitElement } from 'lit';
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

Use `static styles` or a wrapper element when host-level layout must be enforced. Do not document new components around a nonexistent base class.

### PageElement

`PageElement` extends `LitElement` and adds:
- document title and description updates from `page.json`
- page-local translation lookup via `trans()`
- `navigateTo()` helper for programmatic navigation
- a default full-size wrapper around `renderContents()`

If you want the default wrapper, override `renderContents()`. If the page needs a custom shell, override `render()` directly.

### Authentication Pattern

Use `userSnapshot()` with `track()` for auth-aware rendering.

```ts
protected user = userSnapshot();

protected override render(): TemplateResult {
  return html`${track(this.user, (user) => {
    return user ? html`Welcome!` : html`Please sign in`;
  })}`;
}
```

The admin site additionally subscribes to the user document in Firestore to keep `admin` permission state current.

### Navigation

Use `@lit-labs/router` routes plus the helper exported from `@app/page`.

```ts
html`<button ${navigate('/helloworld/')}>Hello World</button>`;

await Navigate.to('/dashboard/');
```

### Firestore Access in Hosting

Prefer client-side models for direct Firestore access.

```ts
import { UserDocument, subscribeToUserDocument } from '@models/user';

const unsubscribe = subscribeToUserDocument(uid, (userData) => {
  console.log(userData?.admin);
});
```

When updating document data, use immutable reconstruction rather than mutating nested fields in place.

### Callable Functions Clients

Use `callFirebaseFunction()` from `src/app/functions/functions.ts` to keep request and response types explicit.

```ts
import { callFirebaseFunction } from '@app/functions';
import type { SampleRunRequest, SampleRunResponse } from '@functions/types/sample';

export const sample = {
  run: callFirebaseFunction<SampleRunRequest, SampleRunResponse>('sample-run'),
};
```

### Transition Directive

Use the `transition` directive from `@app/transition` for enter and leave animations driven by Tailwind classes.

```ts
html`
  <div ${transition(this.open ? 'enter' : 'leave', {
    enter: 'transition-opacity duration-300 ease-out',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition-opacity duration-200 ease-in',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0',
  })}></div>
`;
```

## Frontend Workflow

Prefer root-level scripts during day-to-day work:

```bash
npm run dev:default
npm run dev:admin
npm run test
npm run test:e2e
```

Package-level scripts remain useful when you want to scope work to hosting only:

```bash
cd hosting
npm run test
npm run test:watch
npm run coverage
```
```ts
${transition(show ? 'enter' : 'leave', {
  enter: 'transition-opacity duration-300 ease-out',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  leave: 'transition-opacity duration-200 ease-in',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0',
})}
```

**Scale and fade**:
```ts
${transition(show ? 'enter' : 'leave', {
  enter: 'transition-all duration-300 ease-out',
  enterFrom: 'opacity-0 scale-95',
  enterTo: 'opacity-100 scale-100',
  leave: 'transition-all duration-200 ease-in',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-95',
})}
```

**Slide up**:
```ts
${transition(show ? 'enter' : 'leave', {
  enter: 'transition-all duration-300 ease-out',
  enterFrom: 'translate-y-4 opacity-0',
  enterTo: 'translate-y-0 opacity-100',
  leave: 'transition-all duration-200 ease-in',
  leaveFrom: 'translate-y-0 opacity-100',
  leaveTo: 'translate-y-4 opacity-0',
})}
```

**Responsive transitions** (mobile vs desktop):
```ts
${transition(show ? 'enter' : 'leave', {
  enter: 'transition-all duration-300 ease-out',
  enterFrom: 'translate-y-4 opacity-0 sm:scale-95',
  enterTo: 'translate-y-0 opacity-100 sm:scale-100',
  leave: 'transition-all duration-200 ease-in',
  leaveFrom: 'translate-y-0 opacity-100 sm:scale-100',
  leaveTo: 'translate-y-4 opacity-0 sm:scale-95',
})}
```

#### Implementation Details

- Uses `transitionend` event to detect animation completion
- Automatically cleans up event listeners when direction changes
- Applies `hidden` class when in leave state
- Requires at least one CSS transition property (duration, etc.)
- Works with any Tailwind transition utilities

#### Example: Dialog Backdrop and Panel

```ts
// Backdrop fade
<div
  ${transition(this.open ? 'enter' : 'leave', {
    enter: 'transition-opacity duration-300 ease-out',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition-opacity duration-200 ease-in',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0',
  })}
  class="fixed inset-0 bg-gray-500/75"
></div>

// Panel slide and fade
<div
  ${transition(this.open ? 'enter' : 'leave', {
    enter: 'transition-all duration-300 ease-out',
    enterFrom: 'translate-y-4 opacity-0 sm:scale-95',
    enterTo: 'translate-y-0 opacity-100 sm:scale-100',
    leave: 'transition-all duration-200 ease-in',
    leaveFrom: 'translate-y-0 opacity-100 sm:scale-100',
    leaveTo: 'translate-y-4 opacity-0 sm:scale-95',
  })}
  class="rounded-lg bg-white p-6"
>
  Dialog content
</div>
```

## Multi-site Architecture

- Vite build supports multiple entry points
- `APP_SITE` environment variable determines which site to build
- Shared components and core logic across sites

## Firebase Configuration

- Firebase SDK v10+
- Modular imports for tree-shaking
- IndexedDB persistence for offline support
- Automatic ID token refresh (55-minute interval)
