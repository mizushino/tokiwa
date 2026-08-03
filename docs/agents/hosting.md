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
├── vitest.config.ts     # Component test config
└── vite.config.ts       # vite-plus (vp) config
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
Reusable components shared across sites. Current UI components include button, checkbox, dialog, dropdown, input, language-switcher, modal, sidebar, split, and table.

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
  "description": "A simple example page for the default site.",
  "localizationId": "default.helloworld"
}
```

`localizationId` is the prefix used by Lit Localize messages for the page.

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

### Internationalization (i18n)

`src/app/i18n/` configures the official `@lit/localize` runtime. Supported languages are `'en'` and `'ja'`
(`SupportedLanguage`), with English as the source locale.

#### Language State

- `getPreferredLanguage()` returns the active locale; `setPreferredLanguage(lang)` updates Lit Localize and returns a promise
- `subscribePreferredLanguage(listener)` registers a change listener and returns an unsubscribe function
- Signed-in preferences are stored in the `lang` field of `users/{uid}` and synchronized by its Firestore listener
- Signed-out language changes are session-only and are not written to browser storage

`PageElement` already subscribes: on a language change it re-applies page metadata and re-renders, so pages usually need no extra wiring. A non-page component that renders language-dependent output must subscribe itself, following the same pattern as `ui-language-switcher`:

```ts
private unsubscribeLanguage?: () => void;

public override connectedCallback(): void {
  super.connectedCallback();
  this.unsubscribeLanguage = subscribePreferredLanguage(() => this.requestUpdate());
}

public override disconnectedCallback(): void {
  super.disconnectedCallback();
  this.unsubscribeLanguage?.();
  this.unsubscribeLanguage = undefined;
}
```

#### Language Preference

`seedPreferredLanguageIfUnset(lang)` applies a soft site default before Auth finishes. The default sample site seeds
English and the admin site seeds Japanese. `syncPreferredLanguageFromUser(user)` is called by the Auth layer and starts
or stops the Firestore preference subscription.

The user document has this optional preference field:

```ts
{ lang?: 'en' | 'ja' }
```

Effective priority is Firestore user preference → site default → English source locale. Language-only user document
updates are excluded from the Firebase Auth/custom-claims synchronization trigger. Do not encode preferences in Firebase
Auth profile fields or persist them to `localStorage`.

#### Translation Lookup

- Source messages use `msg()` in `src/app/i18n/messages.ts`, with stable IDs such as `default.helloworld.hero_title`
- Japanese translations live in `hosting/xliff/ja.xlf`; generated runtime modules live under `src/generated/`
- `this.trans(code)` prefixes the code with the page's `localizationId`, then falls back to a `global.*` message and finally the code itself
- `PageElement` localizes `title` and `description` through the same message catalog and reapplies document metadata after locale changes
- Shared UI labels use `tGlobal(code)`. Placeholders such as `{keyword}` remain plain strings the caller replaces

```json
{
  "title": "Hello, World!",
  "description": "A simple example page.",
  "localizationId": "default.helloworld"
}
```

```ts
protected override render(): TemplateResult {
  return html`<h1>${this.trans('hero_title')}</h1>`;
}
```

After editing source messages, update the XLIFF and generated runtime module:

```bash
npm -w hosting run localize:extract
# Translate hosting/xliff/ja.xlf
npm -w hosting run localize:build
```

#### Language Switcher

`<ui-language-switcher>` is the shared toggle control. It shows the name of the other language and calls `setPreferredLanguage()` on click; place it in headers or sidebars instead of hand-rolling per-site switchers.

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

#### Common Patterns

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

## Frontend Workflow

Prefer root-level scripts during day-to-day work:

```bash
npm run dev:default
npm run dev:admin
npm run test
npm run e2e
```

Package-level scripts remain useful when you want to scope work to hosting only:

```bash
cd hosting
npm run test
npm run test:watch
npm run e2e
```

## Multi-site Architecture

- Vite build supports multiple entry points
- `APP_SITE` environment variable determines which site to build
- Shared components and core logic across sites

## Firebase Configuration

- Firebase SDK v12+
- Modular imports for tree-shaking
- IndexedDB persistence for offline support
