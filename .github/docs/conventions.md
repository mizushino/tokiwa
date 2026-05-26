# Code Conventions

This document defines coding standards and conventions for the project.

## Language

### Documentation and Commit Messages
- **All documentation** (README, guides, code comments) must be written in **English**
- **All commit messages** must be written in **English** following Conventional Commits specification
- **Code comments** should be in English for consistency and international collaboration
- Inline comments explaining "why" should be in English

## Code Style

### Linting and Formatting
- **ESLint 10 flat config** with `typescript-eslint` and `eslint-plugin-import-x` for code quality
- **Prettier** is configured per package (`hosting/prettier.config.js`, `functions/prettier.config.js`)
- **IMPORTANT**: After writing or modifying source code, always run the linter to ensure consistent code style

```bash
# ALWAYS run from the root directory to check ALL packages (hosting + functions)
cd /path/to/<project>  # Root directory
npm run lint && npm run build

# This runs lint and build for both hosting and functions packages
# Running from subdirectories (hosting/ or functions/) will miss errors in other packages
```

**Critical Rule**: Always run `npm run lint && npm run build` from the **root directory** (`<project>/`), not from subdirectories. This ensures all packages are checked and prevents errors from being missed.

### Coding Conventions

#### General
- Prefer modern web standards (Custom Elements, ES Modules, etc.)
- Functional and declarative patterns where possible
- Use descriptive variable names over abbreviations
- Keep functions focused on a single responsibility

#### Unused Parameters
Prefix with underscore (`_`):

```ts
// ✅ Good: Unused parameter prefixed with _
private renderCell(_row: unknown, column: TableColumn, index: number): TemplateResult {
  // ...
}

// ❌ Bad: Unused parameter without underscore (ESLint error)
private renderCell(row: unknown, column: TableColumn, index: number): TemplateResult {
  // ...
}
```

#### TypeScript
- Enable strict mode
- Avoid `any` type, use `unknown` when type is unclear
- Use interfaces for object shapes
- Use type aliases for unions and complex types
- Always provide return types for functions

#### File Organization
```ts
// 1. Imports (grouped and sorted)
import { html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { tailwindCSS } from '@app/styles';

// 2. Type definitions
interface MyData {
  id: string;
  name: string;
}

// 3. Constants
const MAX_ITEMS = 100;

// 4. Component/Class definition
@customElement('my-component')
export class MyComponent extends LitElement {
  static override styles = [tailwindCSS];

  // Properties
  @property() data: MyData[] = [];

  // Lifecycle methods
  override connectedCallback() { }

  // Public methods
  public doSomething() { }

  // Private methods
  private handleClick() { }

  // Render methods
  protected override render() { }
}

// 5. Type declarations
declare global {
  interface HTMLElementTagNameMap {
    'my-component': MyComponent;
  }
}
```

## Git Commit Guidelines

Follow the **Conventional Commits** specification for all commit messages.

See **[Commit Guide](./commit.md)** for detailed rules and examples.

**Quick Reference:**
```bash
feat: add new feature
fix: bug fix
docs: documentation changes
test: add or update tests
refactor: code refactoring
chore: build process or tooling changes
```

## Naming Conventions

### Files and Directories
- Use kebab-case for file and directory names: `user-profile.ts`, `my-component/`
- Test files: `{name}.test.ts` or `{name}.spec.ts`
- Type definition files: `{name}.d.ts`
- Component files: Match the custom element name

### Variables and Functions
```ts
// camelCase for variables and functions
const userName = 'John';
function getUserData() { }

// PascalCase for classes and components
class UserProfile { }
@customElement('user-profile')
export class UserProfile extends LitElement {
  static override styles = [tailwindCSS];
}

// SCREAMING_SNAKE_CASE for constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
```

### Custom Elements
- Use kebab-case for custom element names
- Prefix with site/module name: `admin-dashboard`, `ui-button`
- Must contain at least one hyphen (Web Components standard)

```ts
// ✅ Good
@customElement('admin-user-list')
@customElement('ui-button')

// ❌ Bad
@customElement('userlist')      // No hyphen
@customElement('AdminUserList') // Not kebab-case
```

### TypeScript Interfaces and Types
```ts
// PascalCase for interfaces and types
interface UserData { }
type UserId = string;

// Prefix with 'I' is NOT recommended (TypeScript convention)
// ❌ Bad
interface IUserData { }

// ✅ Good
interface UserData { }
```

## Documentation

### Code Comments
- Use JSDoc for public APIs
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes

```ts
/**
 * Calculates project permissions for a user
 * Pure function for testing
 * 
 * @param currentPermissions - Existing permissions array
 * @param pid - Project ID
 * @param projectUserData - User role data (null if removed)
 * @returns Updated permissions array
 */
export function calculateProjectPermissions(
  currentPermissions: string[] | undefined,
  pid: string,
  projectUserData: ProjectUserData | null
): string[] {
  // Filter out the current project
  const projects = (currentPermissions || []).filter(
    (project) => !project.startsWith(pid)
  );
  
  // Add new role if user is still in project
  if (projectUserData && roleTable.has(projectUserData.role)) {
    projects.push(`${pid}:${roleTable.get(projectUserData.role)}`);
  }
  
  return projects;
}
```

### README Files
- Add README.md files when a directory needs standalone onboarding or non-obvious usage notes
- Keep documentation close to the code it describes
- Remove or update docs when structure changes; do not leave stale usage guides in place

## Best Practices

### Error Handling
```ts
// ✅ Good: Specific error types
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof HttpsError) {
    console.error('API error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}

// ❌ Bad: Silent failures
try {
  await riskyOperation();
} catch { }
```

### Async/Await
```ts
// ✅ Good: Use async/await
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  return response.json();
}

// ❌ Bad: Promise chains when async/await is clearer
function fetchData(): Promise<Data> {
  return fetch('/api/data')
    .then(response => response.json());
}
```

### Imports
```ts
// ✅ Good: Organized imports
// 1. External libraries
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// 2. Internal modules
import { tailwindCSS } from '@app/styles';
import { UserDocument } from '@models/user';

// 3. Types (with 'type' prefix)
import type { UserData } from '@firestore/types/user.js';

// ❌ Bad: Mixed order, no grouping
import type { UserData } from '@firestore/types/user.js';
import { html } from 'lit';
import { tailwindCSS } from '@app/styles';
```

### Magic Numbers
```ts
// ✅ Good: Named constants
const MAX_RETRY_COUNT = 3;
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes

for (let i = 0; i < MAX_RETRY_COUNT; i++) {
  // ...
}

// ❌ Bad: Magic numbers
for (let i = 0; i < 3; i++) {
  // ...
}
setTimeout(refreshToken, 3300000);
```
