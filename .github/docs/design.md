# Design Guide

This document defines UI and styling guidance for the project.

Use this guide for visual and interaction rules.

For implementation details such as file structure, routing, page creation, and hosting architecture, see [Hosting Development Guide](./hosting.md).

## Goals

- Keep the visual language consistent across sites and reusable components
- Prefer maintainable Tailwind CSS v4 utilities over ad-hoc custom CSS
- Preserve accessibility, responsive behavior, and clear interaction states
- Extend existing site styles instead of introducing isolated design systems

## Design Principles

### Start from the Existing Site Language
- Match the visual tone, spacing scale, border radius, shadows, and typography already used in the target site
- Prefer extending existing patterns over inventing a new layout or component style for a single screen
- Reuse existing UI components from `hosting/src/components/ui/` before creating a new one

### Design for States
Every UI should account for the following states when relevant:
- Default
- Hover / focus / active
- Disabled
- Loading
- Empty
- Error
- Success or completion feedback

### Prefer Clarity Over Decoration
- Use visual emphasis to support hierarchy, not to add noise
- Keep dense admin screens readable with consistent spacing and restrained accent usage
- Reserve strong color usage for actions, alerts, and status changes

## Tailwind CSS v4 Rules

### Use Tailwind Utilities First
- Prefer Tailwind utility classes in templates for component-level styling
- Keep class lists close to the markup they affect
- Use custom CSS only when styles are shared, global, repeated, or impossible to express cleanly with utilities

### Prefer Theme Tokens Over Raw Values
- Use project theme tokens before introducing arbitrary values such as `px-[13px]` or `text-[#123456]`
- Add or adjust shared tokens in the site stylesheet when a new color, spacing rule, or typography scale is needed across multiple screens
- Prefer semantic color families such as primary, secondary, success, warning, danger, and info when they map to the intended meaning

Example from the current admin site theme:

```css
@theme {
  --font-sans: "Noto Sans JP", sans-serif;

  --color-primary-500: var(--color-indigo-500);
  --color-secondary-500: var(--color-slate-500);
  --color-success-500: var(--color-emerald-500);
  --color-danger-500: var(--color-rose-500);
}
```

### Use Tailwind v4 Syntax
- Use Tailwind v4 class names and conventions, not legacy syntax
- Prefer `bg-linear-to-br` over `bg-gradient-to-br`
- Prefer `shrink-0` over `flex-shrink-0`
- Keep syntax aligned with the project configuration already in use

### Avoid One-Off Styling Drift
- Avoid long chains of arbitrary values unless there is a strong visual requirement
- If the same utility combination appears repeatedly, consider moving the pattern into a reusable component or shared host classes
- Do not add inline styles unless the value must be dynamic and cannot be expressed safely another way

## Lit Component Styling

### Use the Correct Base Class
- Reusable components should extend `LitElement` and include `tailwindCSS` in their static styles
- Pages should extend `PageElement`
- Do not build project UI directly on plain `LitElement` without including `tailwindCSS` unless there is a deliberate reason to bypass shared styling

```ts
import { LitElement } from 'lit';
import { tailwindCSS } from '@app/styles';
import { customElement } from 'lit/decorators.js';

@customElement('ui-example-card')
export class UiExampleCard extends LitElement {
  static override styles = [tailwindCSS];
}
```

### Tailwind Runs in Shadow DOM
- `tailwindCSS` is a constructable CSSStyleSheet that injects the shared Tailwind stylesheet into Shadow DOM
- Write utility classes in templates as usual
- When host-level layout matters, use `static styles` for `:host` or wrap content in a layout container

```ts
import { LitElement, css } from 'lit';
import { tailwindCSS } from '@app/styles';

static override styles = [
  tailwindCSS,
  css`
    :host {
      display: block;
      width: 100%;
    }
  `,
];
```

### Keep Components Composable
- Prefer small building blocks with slots or focused props over large monolithic components
- Reuse shared UI primitives for buttons, dialogs, dropdowns, tables, sidebars, and form controls
- When a pattern is specific to one page and unlikely to be reused, keep it local to that site or page

## Layout and Spacing

### Responsive First
- Build mobile-first layouts, then scale up for larger breakpoints
- Prefer flexbox and grid utilities over manual margin hacks
- Use consistent gap spacing instead of mixing unrelated margin values

### Maintain Readable Density
- Admin screens may be information-dense, but they should still preserve clear grouping and scanning paths
- Use spacing, section headers, and surface contrast to separate content blocks
- Avoid deeply nested cards or excessive borders when simpler grouping works

### Content Width and Height
- Let pages grow naturally with content while keeping key actions visible
- Use full-height layouts only when the interaction truly depends on them
- Avoid fixed heights for content-heavy areas unless paired with deliberate scrolling behavior

## Typography and Color

### Typography
- Use the site font stack defined in theme tokens
- Keep heading, body, caption, and helper text sizes consistent across screens
- Prefer stronger hierarchy through size and weight changes rather than excessive color variation

### Color Usage
- Use semantic colors for meaning, not just appearance
- Ensure text and interactive elements maintain sufficient contrast
- Do not rely on color alone to communicate status; pair it with labels, icons, or helper text when needed

## Forms and Feedback

### Forms
- Use shared form components and project form plugin styles when possible
- Keep labels, helper text, validation messages, and required markers consistent
- Surface validation close to the field and make the corrective action obvious

### Feedback Patterns
- Use modals intentionally for confirmation, destructive actions, or important feedback
- Prefer inline feedback for local validation and non-blocking status updates
- Keep destructive actions visually distinct and require confirmation when consequences are hard to undo

## Accessibility

- Ensure keyboard navigation works for all interactive controls
- Always provide visible focus styles
- Use semantic HTML before adding ARIA attributes
- Ensure icon-only controls have accessible names
- Treat loading and error states as part of the accessible UI, not as afterthoughts

## When to Add CSS Instead of Utilities

Add or edit CSS when one of these is true:
- The style is global or theme-level
- The same pattern appears in multiple places
- The style cannot be expressed clearly with utilities alone
- A site needs a shared visual token or typography rule

Keep CSS close to the owning site or shared component. Do not create disconnected style layers for single-use tweaks.

## Design Checklist

Before shipping a UI change, verify:
- The component extends the correct base class (`LitElement` with `tailwindCSS`, or `PageElement`) and includes Tailwind styles in Shadow DOM
- Tailwind v4 syntax is used
- Existing theme tokens and shared components were preferred over one-off values
- Mobile, desktop, empty, loading, and error states were considered
- Focus, keyboard access, and contrast remain acceptable
- The design matches the surrounding site language