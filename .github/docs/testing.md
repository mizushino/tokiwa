# Testing Guide

This guide covers testing strategies for the project:
- **Component Testing**: Vitest for Lit components (hosting)
- **Playwright E2E Testing**: Browser-based E2E tests (hosting)
- **Functions E2E Testing**: Firebase Emulator-based tests (functions)

---

## Component Testing (Hosting)

### Testing Framework
- **Vitest**: Fast unit test framework with happy-dom environment
- **happy-dom**: Lightweight DOM implementation for testing
- **Coverage**: v8 provider for code coverage reporting

### Running Tests
```bash
cd hosting

# Run all tests
npm run test

# Run tests in watch mode
npm run test:run

# Generate coverage report
npm run coverage

# Open coverage UI
npm run test:ui
```

### Test File Structure
Test files are colocated with their components:
```
hosting/src/components/ui/sidebar/
├── ui-sidebar.ts
└── ui-sidebar.test.ts
```

### Writing Component Tests

#### Basic Setup Pattern
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyComponent } from './my-component';
import './my-component';

describe('MyComponent', () => {
  let element: MyComponent;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = document.createElement('my-component') as MyComponent;
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders with default properties', async () => {
    await element.updateComplete;
    expect(element).toBeDefined();
  });
});
```

#### Key Testing Principles

**1. Test Behavior, Not Implementation**
```ts
// ❌ Bad: Testing Tailwind classes (implementation detail)
expect(button.className).toContain('bg-blue-500');

// ✅ Good: Testing DOM structure and behavior
const button = element.querySelector('button[type="submit"]');
expect(button).toBeTruthy();
button?.click();
expect(mockHandler).toHaveBeenCalled();
```

**2. Avoid Testing Styles**
```ts
// ❌ Bad: Style-dependent tests
expect(element.className).toContain('rotate-180');

// ✅ Good: Structural and semantic tests
const icon = element.querySelector('svg');
expect(icon?.getAttribute('aria-hidden')).toBe('true');
```

**3. Test User Interactions**
```ts
it('emits custom event on click', async () => {
  element.data = sampleData;
  await element.updateComplete;

  const eventHandler = vi.fn();
  element.addEventListener('itemclick', eventHandler);

  const item = element.querySelector('[data-testid="item-0"]');
  item?.click();

  expect(eventHandler).toHaveBeenCalledOnce();
});
```

**4. Test Conditional Rendering**
```ts
it('shows empty state when no data', async () => {
  element.data = [];
  await element.updateComplete;

  const emptyMessage = element.querySelector('[data-empty]');
  expect(emptyMessage?.textContent).toContain('No items found');
});
```

**5. Test Accessibility**
```ts
it('has proper ARIA attributes', async () => {
  await element.updateComplete;

  const button = element.querySelector('button');
  expect(button?.getAttribute('aria-label')).toBe('Close dialog');
});
```

### Common Testing Patterns

**Testing with Light DOM:**
```ts
it('renders in light DOM', async () => {
  await element.updateComplete;
  
  // Query directly on element, not shadowRoot
  const heading = element.querySelector('h1');
  expect(heading?.textContent).toBe('Title');
});
```

**Testing with Shadow DOM:**
```ts
it('renders in shadow DOM', async () => {
  await element.updateComplete;
  
  // Query via shadowRoot
  const heading = element.shadowRoot?.querySelector('h1');
  expect(heading?.textContent).toBe('Title');
});
```

**Testing Async Operations:**
```ts
it('loads data asynchronously', async () => {
  const promise = element.loadData();
  
  await element.updateComplete;
  expect(element.loading).toBe(true);
  
  await promise;
  await element.updateComplete;
  
  expect(element.loading).toBe(false);
  expect(element.data.length).toBeGreaterThan(0);
});
```

### Coverage Goals

**What to test:**
- ✅ All user-facing functionality
- ✅ Event handlers and custom events
- ✅ Conditional rendering paths
- ✅ Error states and edge cases
- ✅ Property changes and reactivity

**What NOT to test:**
- ❌ Tailwind CSS class names
- ❌ Specific pixel values or colors
- ❌ CSS layout behavior
- ❌ Third-party library internals

---

## Playwright E2E Testing (Hosting)

### Overview
Playwright provides browser-based E2E testing for the hosting application, testing real user interactions across multiple sites.

### Running Tests
```bash
cd hosting

# Run all E2E tests (servers start automatically)
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode (step-through)
npm run test:e2e:debug

# Show last test report
npm run test:e2e:report
```

Playwright automatically starts:
- Default site: `http://localhost:5173`
- Admin site: `http://localhost:5174`

### Test File Structure
E2E tests are colocated with the pages they test:
```
hosting/src/sites/
├── default/
│   └── default.spec.ts     # Default site E2E tests
└── admin/
    └── admin.spec.ts       # Admin site E2E tests
```

### Writing E2E Tests

#### Basic Test Pattern
```ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');
    await page.waitForLoadState('networkidle');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

#### Testing Multi-Site Architecture
```ts
test.describe('Admin Site', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test('admin page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Admin/);
  });
});
```

#### Testing Custom Elements
```ts
test('custom element renders correctly', async ({ page }) => {
  await page.goto('/');
  
  await page.waitForFunction(() => {
    return customElements.get('my-component') !== undefined;
  });
  
  const element = page.locator('my-component');
  await expect(element).toBeVisible();
});
```

### Best Practices

**1. Use Stable Selectors**
```ts
// ✅ Good: Semantic selectors
page.locator('button[type="submit"]')
page.locator('[aria-label="Close dialog"]')
page.locator('[data-testid="user-menu"]')

// ❌ Bad: CSS class selectors
page.locator('.bg-blue-500')
```

**2. Wait for Network**
```ts
await page.waitForLoadState('networkidle');

await page.waitForResponse(resp => 
  resp.url().includes('/api/users') && resp.status() === 200
);
```

**3. Handle Async Operations**
```ts
// ✅ Good: Wait for elements to appear
await expect(page.locator('.toast-message')).toBeVisible();

// ❌ Bad: Check immediately
expect(page.locator('.toast-message')).toBeVisible();
```

### Configuration

Key configuration in `hosting/playwright.config.ts`:
```ts
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.spec.ts',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  webServer: [
    {
      command: 'PORT=5173 APP_SITE=default npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'PORT=5174 APP_SITE=admin npm run dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## Functions E2E Testing

### Testing Framework
- **Vitest**: Fast test framework with node environment
- **Firebase Emulator**: Real Firebase services locally
- **firebase-functions-test**: Integration testing utilities

### Running Tests
```bash
cd functions

# Run all tests with emulator
npm run test

# Generate coverage report
npm run coverage

# Emulator ports:
# - Auth: 9099
# - Firestore: 8080
# - Storage: 9199
```

### Test File Structure
Test files are colocated with services:
```
functions/src/services/user/
├── user.ts
└── user.test.ts
```

### Writing E2E Tests

#### Basic Setup Pattern
```ts
import * as admin from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const testEnv = firebaseFunctionsTest({
  projectId: '<projectId>',
  storageBucket: '<storageBucket>',
});

describe('user service E2E', () => {
  let db: admin.firestore.Firestore;
  let auth: admin.auth.Auth;

  beforeAll(() => {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
    auth = admin.auth();
  });

  afterEach(async () => {
    // Clean up test data
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });

  it('creates user document on authentication signup', async () => {
    const { handleUserCreated } = await import('./user.js');
    
    const uid = 'test-user-123';
    const email = 'test@example.com';
    
    await handleUserCreated(uid, email, 'Test User', null);
    
    const userDoc = await db.collection('users').doc(uid).get();
    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.email).toBe(email);
  });
});
```

#### Testing Callable Functions
```ts
it('processes request with valid data', async () => {
  const { myCallable } = await import('./service.js');
  const wrapped = testEnv.wrap(myCallable);

  const result = await wrapped({
    data: { name: 'test' },
    auth: { uid: 'user123', token: {} },
    rawRequest: {},
    acceptsStreaming: false,
  });

  expect(result).toEqual({ success: true });
});
```

#### Testing Document Triggers
```ts
it('updates related data on document write', async () => {
  const { written } = await import('./service.js');
  const wrapped = testEnv.wrap(written);

  await db.collection('items').doc('item1').set({ name: 'Item 1' });

  const beforeSnap = testEnv.firestore.makeDocumentSnapshot({}, 'items/item1');
  const afterSnap = testEnv.firestore.makeDocumentSnapshot(
    { name: 'Updated Item' },
    'items/item1'
  );

  await wrapped({
    data: testEnv.makeChange(beforeSnap, afterSnap),
    params: { itemId: 'item1' },
  });

  const result = await db.collection('logs').doc('item1').get();
  expect(result.exists).toBe(true);
});
```

### Best Practices

1. **Use Real Firebase Services**: Test with actual Firestore, Auth via emulator
2. **Clean Up After Each Test**: Delete test data in `afterEach`
3. **Extract Business Logic**: Separate testable logic from trigger wrappers
4. **Use Immutable Data Pattern**: Always create new document instances for updates
5. **Keep Tests Independent**: Each test should run in isolation

### Common Pitfalls

**❌ Direct data mutation:**
```ts
userDoc.data.permissions['projects'] = newValue; // May not persist!
```

**✅ Immutable pattern:**
```ts
const updatedDoc = new UserDocument({ uid }, {
  ...userDoc.data,
  permissions: { ...userDoc.data.permissions, projects: newValue }
});
await updatedDoc.save();
```

**❌ Forgetting cleanup:**
```ts
// Test data persists across tests, causing flaky failures
```

**✅ Clean up in afterEach:**
```ts
afterEach(async () => {
  const snapshot = await db.collection('test').get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
});
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
