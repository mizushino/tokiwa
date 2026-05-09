import type { FirebaseApp } from 'firebase/app';
import type { Auth, AuthProvider, Persistence, PopupRedirectResolver, Unsubscribe, User } from 'firebase/auth';
import {
  AuthErrorCodes,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  getIdToken,
  getRedirectResult,
  indexedDBLocalPersistence,
  initializeAuth as initializeFirebaseAuth,
  sendPasswordResetEmail,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { seedPreferredLanguageFromUser } from '@app/i18n';

export type { User } from 'firebase/auth';

/**
 * ID token refresh interval in milliseconds.
 * Firebase ID tokens expire after 1 hour, so refresh at 55 minutes.
 */
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000;

export type AuthErrorCode =
  | 'EMAIL_REQUIRED'
  | 'PASSWORD_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LINKING_REQUIRED'
  | 'EMAIL_NOT_VERIFIED';

export const AuthErrorCode: Record<string, AuthErrorCode> = {
  EmailRequired: 'EMAIL_REQUIRED',
  PasswordRequired: 'PASSWORD_REQUIRED',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  LoginFailed: 'LOGIN_FAILED',
  AccountLinkingRequired: 'ACCOUNT_LINKING_REQUIRED',
  EmailNotVerified: 'EMAIL_NOT_VERIFIED',
};

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}

export interface FirebaseAuthSettings {
  emulatorUrl?: string;
  persistence?: Persistence[];
  popupRedirectResolver?: PopupRedirectResolver;
}

/**
 * Internal authentication state management.
 * Tracks the current user, loading state, and auto-refresh timer.
 */
interface AuthState {
  auth?: Auth;
  resolver?: PopupRedirectResolver;
  isLoadingState: boolean;
  autoRefreshIdToken?: ReturnType<typeof setTimeout>;
  unsubscribeAuthStateChanged?: Unsubscribe;
  currentUserValue: User | null | undefined;
}

const state: AuthState = {
  isLoadingState: false,
  currentUserValue: undefined,
};

/**
 * Set of listeners that get notified when the user changes.
 * Used by userSnapshot() to create an async stream of user changes.
 */
const userListeners = new Set<(user: User | null) => void>();

/**
 * Notifies all registered listeners about user state changes.
 */
function notifyUserChange(user: User | null): void {
  state.currentUserValue = user;
  userListeners.forEach((listener) => listener(user));
}

/**
 * Creates an async generator that yields user state changes.
 *
 * First yields the current user value immediately, then yields each time
 * the user state changes (sign in, sign out, token refresh, etc).
 *
 * This is designed to work with lit-async's track() directive:
 * @example
 * ```ts
 * protected user = userSnapshot();
 *
 * render() {
 *   return html`${track(this.user, (user) => {
 *     return user ? html`Welcome!` : html`Please sign in`;
 *   })}`;
 * }
 * ```
 */
export async function* userSnapshot(): AsyncGenerator<User | null | undefined, void, unknown> {
  // Immediately yield current value
  yield state.currentUserValue;

  // Then yield each time the user changes
  while (true) {
    const user = await new Promise<User | null>((resolve) => {
      const listener = (u: User | null): void => {
        userListeners.delete(listener);
        resolve(u);
      };
      userListeners.add(listener);
    });
    yield user;
  }
}

function getAuth(): Auth {
  if (!state.auth) {
    throw new Error('Firebase Auth is not initialized. Call initializeFirebaseAuth first.');
  }
  return state.auth;
}

function getResolver(): PopupRedirectResolver {
  if (!state.resolver) {
    throw new Error('Firebase Auth is not initialized. Call initializeFirebaseAuth first.');
  }
  return state.resolver;
}

/**
 * Handles Firebase Auth errors and converts them to custom AuthError.
 *
 * @param error - The error from Firebase Auth
 * @param specificErrorCodes - Firebase error codes to map to specificAuthError
 * @param specificAuthError - Custom error code to throw for specific Firebase errors
 */
function handleAuthError(error: unknown, specificErrorCodes?: string[], specificAuthError?: AuthErrorCode): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string };
    if (specificErrorCodes?.includes(firebaseError.code)) {
      throw new AuthError(specificAuthError || AuthErrorCode.InvalidCredentials);
    }
  }
  throw new AuthError(AuthErrorCode.LoginFailed);
}

function stopAutoRefresh(): void {
  if (state.autoRefreshIdToken) {
    clearTimeout(state.autoRefreshIdToken);
    state.autoRefreshIdToken = undefined;
  }
}

async function refreshToken(): Promise<void> {
  const auth = getAuth();
  if (auth.currentUser) {
    await getIdToken(auth.currentUser, true);
    startAutoRefreshIdToken();
  }
}

function startAutoRefreshIdToken(): void {
  stopAutoRefresh();

  const auth = getAuth();
  if (!auth.currentUser) {
    return;
  }

  state.autoRefreshIdToken = setTimeout(() => refreshToken(), TOKEN_REFRESH_INTERVAL);
}

/**
 * Initializes Firebase Authentication with the specified settings.
 *
 * Sets up:
 * - Auth persistence (IndexedDB by default)
 * - Auth state change listener to notify userSnapshot() subscribers
 * - Automatic ID token refresh
 * - Redirect result handling for popup/redirect flows
 */
export function initializeAuth(firebaseApp: FirebaseApp, settings?: FirebaseAuthSettings): void {
  const persistence = settings?.persistence || [indexedDBLocalPersistence, browserLocalPersistence];
  const resolver = settings?.popupRedirectResolver || browserPopupRedirectResolver;

  state.auth = initializeFirebaseAuth(firebaseApp, {
    persistence,
    popupRedirectResolver: resolver,
  });
  state.resolver = resolver;

  if (settings?.emulatorUrl) {
    connectAuthEmulator(state.auth, settings.emulatorUrl);
  }

  // Listen for auth state changes and notify all userSnapshot() subscribers
  state.auth.onAuthStateChanged((user) => {
    seedPreferredLanguageFromUser(user);
    notifyUserChange(user);
    if (user) {
      startAutoRefreshIdToken();
    }
  });

  // Handle redirect results from popup/redirect sign-in flows
  getRedirectResult(state.auth, resolver)
    .then(async (result) => {
      if (result?.user) {
        startAutoRefreshIdToken();
      }
    })
    .catch(console.error);
}

export function getFirebaseAuth(): Auth {
  return getAuth();
}

export function isLoading(): boolean {
  return state.isLoadingState;
}

export function currentUser(): User | null {
  return getAuth().currentUser;
}

export function isSignedIn(): boolean {
  return !!getAuth().currentUser;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  if (!email) {
    throw new AuthError(AuthErrorCode.EmailRequired);
  }
  if (!password) {
    throw new AuthError(AuthErrorCode.PasswordRequired);
  }

  const auth = getAuth();

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Block sign-in until the user's email address has been verified.
    if (!credential.user.emailVerified) {
      // Sign out the user since they can't proceed without verification.
      await auth.signOut();
      throw new AuthError(AuthErrorCode.EmailNotVerified);
    }
  } catch (error: unknown) {
    // Re-throw AuthError as-is
    if (error instanceof AuthError) {
      throw error;
    }
    handleAuthError(
      error,
      [AuthErrorCodes.USER_DELETED, AuthErrorCodes.INVALID_PASSWORD],
      AuthErrorCode.InvalidCredentials
    );
  }

  startAutoRefreshIdToken();
}

export async function signInWithCustomToken(token: string): Promise<void> {
  const auth = getAuth();

  try {
    await firebaseSignInWithCustomToken(auth, token);
  } catch (error: unknown) {
    handleAuthError(error, [AuthErrorCodes.INVALID_CUSTOM_TOKEN], AuthErrorCode.InvalidCredentials);
  }

  startAutoRefreshIdToken();
}

export async function signInWithProvider(
  provider: AuthProvider,
  customResolver?: PopupRedirectResolver,
  usePopup = false
): Promise<void> {
  const auth = getAuth();
  const resolver = customResolver || getResolver();

  if (usePopup) {
    try {
      await signInWithPopup(auth, provider, resolver);
    } catch (error: unknown) {
      handleAuthError(error);
    }
    startAutoRefreshIdToken();
    return;
  }

  await signInWithRedirect(auth, provider, resolver);
}

export async function signOut(): Promise<void> {
  stopAutoRefresh();
  const auth = getAuth();

  try {
    await auth.signOut();
  } catch (error: unknown) {
    handleAuthError(error);
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (!email) {
    throw new AuthError(AuthErrorCode.EmailRequired);
  }

  const auth = getAuth();

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    handleAuthError(error, [AuthErrorCodes.USER_DELETED], AuthErrorCode.InvalidCredentials);
  }
}

/**
 * Waits for the initial auth state to be resolved.
 *
 * Useful when you need to know the user's auth state before rendering,
 * but prefer using userSnapshot() with lit-async track() for reactive updates.
 */
export async function loadUser(): Promise<User | null> {
  const auth = getAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  state.isLoadingState = true;

  await new Promise((resolve) => {
    state.unsubscribeAuthStateChanged = auth.onAuthStateChanged((user) => {
      if (user) {
        startAutoRefreshIdToken();
      }
      resolve(user);
    });
  });

  state.isLoadingState = false;

  return auth.currentUser;
}

/**
 * Gets the user's language preference from Firestore.
 * Returns 'ja' as default if not set or if user is not signed in.
 */
export function destroy(): void {
  state.unsubscribeAuthStateChanged?.();
  stopAutoRefresh();
  state.auth = undefined;
  state.resolver = undefined;
}
