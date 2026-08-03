# Testing Guide

This project uses three testing layers:

- Component tests for hosting with Vitest and happy-dom
- Browser E2E tests for hosting with Playwright
- Emulator-backed service tests for functions with Vitest

Use the narrowest test command that can falsify the change you just made.

---

## Root-Level Commands

Run these from the repository root when you want a package-agnostic entry point:

```bash
npm run test
npm run test:hosting
npm run test:functions
npm run e2e
npm run e2e:ui
```

## Hosting Component Tests

### Current Setup

- Toolchain: vite-plus (`vp`); tests run through Vitest under the hood (`hosting/vitest.config.ts`)
- Environment: happy-dom
- Include pattern: `src/**/*.test.ts`

### Running Tests

```bash
cd hosting

npm run test          # vp test run
npm run test:watch    # vp test
```

Scope a run to a directory or file by passing a path:

```bash
npm run test -- src/components/ui/button
```

Always run `vp test` from inside the package directory (`hosting/` or `functions/`). Running it from the repository root has no matching Vitest config, so it picks up Playwright specs and emulator-dependent functions tests and reports meaningless failures.

### File Placement

Component and app-level unit tests are colocated with the code they exercise.

Examples in the current tree:

```text
hosting/src/components/ui/button/ui-button.test.ts
hosting/src/components/ui/sidebar/ui-sidebar.test.ts
hosting/src/app/auth/auth.test.ts
hosting/src/app/page/page.test.ts
```

### Querying the DOM

Most components in this repository extend `LitElement` with `tailwindCSS`, or extend `PageElement`, so they render in Shadow DOM.

```ts
it('renders the heading', async () => {
  const element = document.createElement('my-component') as MyComponent;
  document.body.appendChild(element);

  await element.updateComplete;

  const heading = element.shadowRoot?.querySelector('h1');
  expect(heading?.textContent).toBe('Title');
});
```

Use `element.querySelector()` only when you are intentionally testing light DOM children provided by the test harness or slotted content outside the component's render root.

### What to Assert

- User-facing behavior
- Events and callbacks
- Conditional rendering
- Accessibility attributes and semantics
- Async state transitions

Avoid asserting raw Tailwind class names or implementation-only layout details unless the class itself is the behavior.

---

## Hosting Playwright Tests

### Current Setup

- Test directory: `hosting/src`
- Match pattern: `**/*.spec.ts`
- Base URL: `http://localhost:5173`
- Additional admin site: `http://localhost:5174`
- HTML report output: `.artifacts/playwright/report`

### Running Tests

```bash
cd hosting

npm run e2e            # playwright test
npm run e2e:ui         # playwright test --ui
```

Both are also exposed at the repository root as `npm run e2e` and `npm run e2e:ui`.

`hosting/playwright.config.ts` starts three background services automatically:

1. Firebase emulators for auth, firestore, and storage
2. The default site on port 5173
3. The admin site on port 5174

### File Placement

Playwright specs are colocated under `src/**/*.spec.ts`.

Examples in the current tree:

```text
hosting/src/sites/default/index.spec.ts
hosting/src/sites/default/helloworld/helloworld.spec.ts
hosting/src/sites/admin/admin.spec.ts
hosting/src/sites/admin/buttons/buttons.spec.ts
```

### Good Playwright Practices

- Prefer stable selectors such as roles, labels, and data attributes
- Wait on visible user outcomes instead of arbitrary timeouts
- Use `test.use({ baseURL: 'http://localhost:5174' })` when scoping a describe block to the admin site
- Keep assertions aligned with real user flows, not internal implementation

```ts
test.describe('Admin Site', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test('loads the admin entry page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Admin/);
  });
});
```

---

## Functions Testing

### Current Setup

- Test runner: Vitest
- Environment: node
- Global setup: `functions/src/test-setup.ts`
- Tests run through `firebase emulators:exec`
- Vitest config root is pinned to `functions/` so test discovery is stable even when emulators run from `.artifacts/firebase`

### Running Tests

```bash
cd functions

npm run test
```

Or from the repository root:

```bash
npm run test:functions
```

### File Placement

Functions tests are colocated with their service modules.

```text
functions/src/services/user/user.test.ts
functions/src/services/project/project.test.ts
functions/src/services/storage/storage.test.ts
functions/src/services/sample/sample.test.ts
```

### Preferred Test Shape

Extract business logic into named functions and test those directly. Keep Firebase trigger exports as thin wrappers.

```ts
it('updates permissions when a project role changes', async () => {
  await updateUserPermissions('project-1', 'user-1', {
    role: 'manager',
  } as ProjectUserData);

  const userDocument = new UserDocument({ uid: 'user-1' });
  await userDocument.get();

  expect(userDocument.data.permissions?.projects).toContain('project-1:m');
});
```

### Functions Testing Rules

- Keep tests sequential and isolated; the current config already disables parallel file execution to avoid emulator conflicts
- Clean up any Firestore or Storage state a test creates
- Prefer immutable document updates in both implementation and tests
- Test the exported helper when possible, and wrap the trigger only when the event shape itself is part of the behavior
- For retryable triggers, test that delayed events read the current source document rather than replaying stale snapshots
- Exercise concurrent updates when trigger logic uses read-modify-write on a shared document

---

## Bug Fix Workflow

Fix bugs test-first. Never fix the code before a failing test proves the bug exists.

1. **Reproduce**: add a test that exercises the buggy behavior, in the same file placement as other tests for that module
2. **Confirm it fails**: run the narrowest matching test command and verify the new test fails for the expected reason (the bug), not for a setup mistake
3. **Fix**: change the implementation
4. **Confirm it passes**: re-run the same test command and verify the new test passes along with the existing ones

Rules:

- The reproduction test stays in the codebase as a regression test; do not delete it after the fix
- If the bug cannot be reproduced in a unit test (e.g. browser-only timing), prefer a Playwright test; if no automated reproduction is feasible, state that explicitly instead of skipping the step silently
- Do not weaken or rewrite an existing failing assertion to make it pass unless the assertion itself encoded the buggy expectation

## Verification Strategy

After changing code:

1. Run the narrowest matching test command first
2. Run `npm run lint && npm run build` from the root when the change affects source files
3. Use broader root scripts only after the touched slice is green

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
