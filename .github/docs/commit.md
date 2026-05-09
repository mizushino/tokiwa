# Git Commit Guidelines

Follow the **Conventional Commits** specification for all commit messages.

## Format

```
<type>: <description>

[optional body]

[optional footer]
```

## Types

| Type | Description |
|------|-------------|
| `feat:` | New feature for the user |
| `fix:` | Bug fix for the user |
| `docs:` | Documentation changes |
| `style:` | Code style changes (formatting, missing semicolons, etc.) |
| `refactor:` | Code refactoring without changing functionality |
| `perf:` | Performance improvements |
| `test:` | Adding or updating tests |
| `chore:` | Build process, dependencies, tooling changes |
| `ci:` | CI/CD configuration changes |
| `revert:` | Revert a previous commit |

## Examples

```bash
feat: add user authentication with Firebase Auth

fix: resolve memory leak in data subscription

test: add E2E tests for Cloud Functions with 84% coverage

refactor: extract business logic from triggers for testability

docs: update README with installation instructions

chore: upgrade dependencies to latest versions
```

## Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep the subject line under 72 characters
- Capitalize the subject line
- Don't end the subject line with a period
- Separate subject from body with a blank line
- Use the body to explain what and why, not how

## Subject Line

The subject line should complete the sentence: "If applied, this commit will..."

```bash
# ✅ Good
feat: add user profile page
fix: resolve navigation bug on Safari
docs: update API documentation

# ❌ Bad
feat: added user profile page      # Past tense
fix: fixing navigation bug         # Continuous tense
Update docs                        # No type, not descriptive
```

## Body (Optional)

Provide additional context, motivation, or implementation details:

```bash
feat: add user authentication with Firebase Auth

Implements email/password and Google sign-in flows.
Includes automatic token refresh and offline support.

Closes #123
```

## Footer (Optional)

Reference issues, breaking changes, or other metadata:

```bash
fix: resolve data sync issue with Firestore

BREAKING CHANGE: UserDocument.save() now returns Promise<void> instead of boolean
```

## Quick Reference

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
test: add or update tests
refactor: code refactoring
chore: build process or tooling changes
```
