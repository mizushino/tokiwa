# Hosting Development Guide

This guide covers frontend development with Lit, Tailwind CSS, and Firebase.

Use this guide for implementation concerns such as project structure, routing, page setup, component architecture, and frontend data flow.

For visual rules, Tailwind styling decisions, design consistency, accessibility expectations, and theme-token usage, see [Design Guide](./design.md).

## Directory Structure

```
hosting/src/
├── app/          # Core application logic (auth, navigation, etc.)
├── sites/        # Multi-site support (default, admin, etc.)
├── components/   # Reusable UI components
├── services/     # Functions API client
├── models/       # Database interaction layer
└── assets/       # Static resources (images, fonts, etc.)
```

### Key Directories

#### `app/`
Contains core application functionality shared across all sites:
- **element/**: Base classes for custom elements
  - **light-element.ts**: Light DOM base class with slot functionality
- **page/**: Page-related functionality
  - **page-element.ts**: Base class for page components
  - **navigate.ts**: Client-side navigation with history API
- **auth/**: Firebase Authentication wrapper with AsyncGenerator for reactive auth state
- **functions/**: Firebase Functions initialization

#### `sites/`
Supports multiple independent sites within a single project:
- **default/**: Main public-facing site
- **admin/**: Admin dashboard site
- Each site has its own `index.html`, `app.ts`, `app.css`, and routing

#### `components/`
Reusable Web Components built with Lit:
- **ui/**: UI components (sidebar, buttons, forms, etc.)
- Uses Shadow DOM or Light DOM depending on styling needs

#### `services/`
API clients for calling Cloud Functions:
- Type-safe wrappers around Firebase Functions
- Request/response handling

#### `models/`
Data access layer for Firestore:
- Database schema definitions
- CRUD operations
- Type-safe data models

## Creating a New Page

Pages are organized by URL path within each site directory. Each page requires two files:

### Directory Structure
```
hosting/src/sites/{site-name}/{path}/
├── index.ts       # Page component
└── page.json      # Page metadata
```

### Step 1: Create `page.json`
Define page metadata for SEO and routing:

```json
{
  "title": "Hello, World!",
  "description": "A simple Hello World example for the admin site."
}
```

### Step 2: Create `index.ts`
Extend `PageElement` base class for consistent page behavior:

```ts
import { html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { PageElement } from '@app/page-element';

import pageMetadata from './page.json';

@customElement('admin-helloworld')
export class AdminHelloWorld extends PageElement {
  protected pageMetadata = pageMetadata;

  @property() name = 'World';

  protected override render(): TemplateResult {
    return html`<h1 class="h-full w-full bg-gray-50 p-2">Hello, ${this.name}!</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-helloworld': AdminHelloWorld;
  }
}
```

### Key Points

- **Component naming**: Follow the pattern `{site}-{page-name}` (e.g., `admin-helloworld`)
- **Extend PageElement**: Provides common page functionality and metadata handling
- **Import page.json**: Link metadata to the component via `pageMetadata` property
- **Type declaration**: Always declare the component in `HTMLElementTagNameMap` for TypeScript support
- **Folder structure matches URL**: `sites/admin/dashboard/` → `/dashboard/` route

### Customizing Page Layout Classes

`PageElement` automatically applies `['block', 'w-full', 'h-full']` to the host element. Override `hostClasses` to customize:

```ts
@customElement('admin-custom-page')
export class AdminCustomPage extends PageElement {
  protected pageMetadata = pageMetadata;

  // Override default host classes
  protected static override hostClasses = ['flex', 'items-center', 'justify-center'];

  protected override render(): TemplateResult {
    return html`<div class="text-center">Centered Content</div>`;
  }
}
```

**Common patterns**:
```ts
// Default (full-size block page)
protected static override hostClasses = ['block', 'w-full', 'h-full'];

// Flex container page
protected static override hostClasses = ['flex', 'flex-col', 'w-full', 'h-full'];

// Centered content page
protected static override hostClasses = ['flex', 'items-center', 'justify-center', 'w-full', 'h-full'];

// Minimal styling (let content determine size)
protected static override hostClasses = ['block'];
```

### Step 3: Register the Route

After creating the page, register it in the site's router (e.g., `sites/admin/index.ts`):

```ts
protected routes = new Routes(
  this,
  [
    {
      path: 'helloworld/',
      render: () => html`<admin-helloworld class="block h-full w-full"></admin-helloworld>`,
    },
    // ... other routes
  ]
);
```

Don't forget to import the page component at the top of the file:

```ts
import './helloworld';
```

## Key Patterns

### Authentication Pattern

Uses AsyncGenerator pattern with `lit-async` for reactive auth state:

```ts
export async function* userSnapshot(): AsyncGenerator<User | null | undefined> {
  yield state.currentUserValue;
  while (true) {
    const user = await new Promise<User | null>((resolve) => {
      const listener = (u: User | null): void => resolve(u);
      userListeners.add(listener);
    });
    yield user;
  }
}

// Usage in components
protected user = userSnapshot();

render() {
  return html`${track(this.user, (user) => {
    return user ? html`Welcome!` : html`Please sign in`;
  })}`;
}
```

### Navigation

Uses `@lit-labs/router` for client-side routing with custom `Navigate` directive:

```ts
// Directive usage
html`<a href="/dashboard/" ${navigate('/dashboard/')}>Dashboard</a>`

// Programmatic usage
await Navigate.to('/dashboard/');
```

### Tailwind CSS and Light DOM

#### LightElement Base Class

For components that need Light DOM (required for Tailwind CSS), extend `LightElement`:

```ts
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
#### Setting Display Style for Custom Elements

**Using LightElement's hostClasses** (Recommended):

```ts
@customElement('my-component')
export class MyComponent extends LightElement {
  protected static override hostClasses = ['block', 'w-full', 'h-full'];
  
  protected override render() {
    return html`<div>Content</div>`;
  }
}
```

**Manual approach** (if not using LightElement):

Custom elements are inline by default. Add classes in `connectedCallback`:
@customElement('my-button')
export class MyButton extends LightElement {
  // Automatically applies these classes to the host element
  protected static override hostClasses = ['inline-flex', 'items-center'];

  protected override render() {
    return html`
      <button class="rounded-md px-3 py-2">
        <slot></slot>
      </button>
    `;
  }
}
```

**Features**:
- Automatic Light DOM rendering (no Shadow DOM)
- Host class management via `hostClasses` static property
- Slot functionality in Light DOM (simulates Shadow DOM `<slot>`)
- Child nodes are preserved and inserted into `<slot>` elements
- Supports both named slots (`slot="name"`) and default slot

**Named Slots Example**:
```ts
@customElement('my-card')
export class MyCard extends LightElement {
  protected static override hostClasses = ['block'];

  protected override render() {
    return html`
      <div class="card">
        <header>
          <slot name="title">Default Title</slot>
        </header>
        <main>
          <slot></slot>
        </main>
      </div>
    `;
  }
}
```

**Usage**:
```html
<!-- With named slot -->
<my-card>
  <h2 slot="title">Custom Title</h2>
  <p>Card content goes here</p>
</my-card>

<!-- Without named slot (shows fallback) -->
<my-card>
  <p>Only default slot content</p>
</my-card>
```

**Default Button Example**:
```html
<my-button>Click me</my-button>
<!-- "Click me" text is automatically placed in the <slot> -->
```

#### Light DOM for Tailwind
```ts
protected override createRenderRoot(): HTMLElement | DocumentFragment {
  return this; // Use Light DOM instead of Shadow DOM
}
```

#### Setting Display Style for Custom Elements
Custom elements are inline by default. To make them block elements, add classes in `connectedCallback`:

```ts
public override connectedCallback(): void {
  super.connectedCallback();
  (this.renderRoot as HTMLElement).classList.add('block', 'w-full', 'h-full');
}
```

**Why in `connectedCallback`?**
- Ensures the element is properly styled when added to the DOM
- Works consistently across all usage contexts
- Can be combined with additional classes from the parent

**Best Practice**:
- Set essential display properties (like `display: block`) in `connectedCallback`
- Let parent components control layout-specific properties (margins, padding, etc.) via class attributes

#### Write Utility Classes Inline
Tailwind classes are written directly in HTML templates:

```ts
render() {
  return html`
    <div class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5">
      <img src="${this.avatarUrl}" class="size-8 rounded-full bg-gray-800" />
      <span>${this.userName}</span>
    </div>
  `;
}
```

#### Break Down Large Templates
**Problem**: Large HTML with many Tailwind classes becomes hard to read.

**Solution 1**: Extract into `renderXXX()` methods

```ts
private renderUserProfile(): TemplateResult {
  return html`
    <a
      href="#"
      class="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-white/5"
      @click=${this.handleUserClick}
    >
      <img
        src="${this.currentUser?.photoURL || 'https://www.gravatar.com/avatar/?d=mp'}"
        alt=""
        class="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
      />
      <span class="sr-only">Your profile</span>
      <span aria-hidden="true">${this.currentUser?.displayName || 'User'}</span>
    </a>
  `;
}

render() {
  return html`
    <div class="flex h-full min-h-screen bg-gray-900">
      ${this.renderUserProfile()}
    </div>
  `;
}
```

**Solution 2**: Create separate components

```ts
// Before: Large monolithic component
@customElement('dashboard-page')
class DashboardPage extends LitElement {
  render() {
    return html`
      <div class="...many classes...">
        <!-- 100+ lines of HTML with Tailwind classes -->
      </div>
    `;
  }
}

// After: Split into smaller components
@customElement('dashboard-page')
class DashboardPage extends LitElement {
  render() {
    return html`
      <div class="flex h-full flex-col gap-4 p-6">
        <dashboard-header></dashboard-header>
        <dashboard-stats></dashboard-stats>
        <dashboard-chart></dashboard-chart>
      </div>
    `;
  }
}
```

#### Guidelines
- **One component/method should focus on one UI concern**
- **If a render method exceeds ~30 lines**, consider extracting parts
- **Reusable UI patterns** should become separate components in `components/ui/`
- **Page-specific sections** can use `renderXXX()` methods within the page component

### Font Awesome Icons

The project uses Font Awesome Kit for icons. Icons are loaded via CDN in each site's `index.html`.

#### Setup

Font Awesome Kit is already configured in `hosting/src/sites/{site}/index.html`:

```html
<script src="https://kit.fontawesome.com/c4db74980d.js" crossorigin="anonymous"></script>
```

#### Usage

Font Awesome icons are text-based elements, not SVG. Use text utility classes for sizing:

```ts
// ✅ Good: Text-based sizing
icon: html`<i class="fa-solid fa-house py-0.5 text-xl"></i>`

// ❌ Bad: SVG sizing (doesn't work with Font Awesome)
icon: html`<i class="fa-solid fa-house size-6"></i>`
```

**Common patterns**:
```ts
// Navigation icons (text-xl with vertical padding)
html`<i class="fa-solid fa-folder py-0.5 text-xl"></i>`

// Logo icons (larger size)
html`<i class="fa-solid fa-cube text-4xl text-primary-500"></i>`

// Button icons (inline with text)
html`<i class="fa-solid fa-plus mr-2"></i> Add Item`

// Status icons (smaller size)
html`<i class="fa-solid fa-check text-sm text-success-500"></i>`
```

**Icon Categories**:
- `fa-solid`: Solid style icons (default)
- `fa-regular`: Regular (outline) style icons
- `fa-brands`: Brand logos (GitHub, Twitter, etc.)

**Finding Icons**:
Browse available icons at [fontawesome.com/icons](https://fontawesome.com/icons)

### Transition Directive

The project provides a `transition` directive for animating element enter/leave states with Tailwind CSS classes.

#### Basic Usage

```ts
import { transition } from '@app/transition';

html`
  <div ${transition(this.isVisible ? 'enter' : 'leave', {
    enter: 'transition-opacity duration-300 ease-out',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition-opacity duration-200 ease-in',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0',
  })}>
    Content to animate
  </div>
`
```

#### How It Works

1. **Direction-based**: Pass `'enter'` or `'leave'` as the first argument
2. **Tailwind classes**: Use Tailwind transition utilities for animations
3. **Automatic state management**: Handles `hidden` class and transition timing
4. **Interruptible**: Can switch directions mid-animation

#### Transition Options

```ts
interface TransitionOptions {
  enter: string;        // Classes applied during enter (e.g., 'transition-opacity duration-300')
  enterFrom: string;    // Starting state for enter (e.g., 'opacity-0')
  enterTo: string;      // Ending state for enter (e.g., 'opacity-100')
  leave: string;        // Classes applied during leave
  leaveFrom: string;    // Starting state for leave
  leaveTo: string;      // Ending state for leave
}
```

#### Common Patterns

**Fade transition**:
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
