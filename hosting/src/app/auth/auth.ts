import type { FirebaseApp } from 'firebase/app';
import type { Auth, AuthProvider, Persistence, PopupRedirectResolver, Unsubscribe, User } from 'firebase/auth';
import {
  AuthErrorCodes,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  connectAuthEmulator,
  getRedirectResult,
  indexedDBLocalPersistence,
  initializeAuth as initializeFirebaseAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { syncPreferredLanguageFromUser } from '@app/i18n';

export type { User } from 'firebase/auth';

export type AuthErrorCode =
  | 'EMAIL_REQUIRED'
  | 'PASSWORD_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LINKING_REQUIRED'
  | 'EMAIL_NOT_VERIFIED';

export const AuthErrorCode = {
  EmailRequired: 'EMAIL_REQUIRED',
  PasswordRequired: 'PASSWORD_REQUIRED',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  LoginFailed: 'LOGIN_FAILED',
  AccountLinkingRequired: 'ACCOUNT_LINKING_REQUIRED',
  EmailNotVerified: 'EMAIL_NOT_VERIFIED',
} as const satisfies Record<string, AuthErrorCode>;

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

interface AuthState {
  auth?: Auth;
  resolver?: PopupRedirectResolver;
  redirectAuthError?: Promise<AuthError | null>;
  isLoadingState: boolean;
  unsubscribeAuthStateChanged?: Unsubscribe;
  unsubscribeLoadUser?: Unsubscribe;
  currentUserValue: User | null | undefined;
}

const state: AuthState = {
  isLoadingState: false,
  currentUserValue: undefined,
};

const userListeners = new Set<(user: User | null) => void>();

function notifyUserChange(user: User | null): void {
  state.currentUserValue = user;
  userListeners.forEach((listener) => listener(user));
}

/**
 * Creates an async generator that yields user state changes.
 *
 * First yields the current user value immediately, then yields each time
 * the user state changes (sign in and sign out).
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
  yield state.currentUserValue;

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

const accountLinkingErrorCodes = ['auth/account-exists-with-different-credential', 'auth/credential-already-in-use'];

function toAuthError(error: unknown, specificErrorCodes?: string[], specificAuthError?: AuthErrorCode): AuthError {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string };
    if (specificErrorCodes?.includes(firebaseError.code)) {
      return new AuthError(specificAuthError || AuthErrorCode.InvalidCredentials);
    }
  }
  return new AuthError(AuthErrorCode.LoginFailed);
}

function handleAuthError(error: unknown, specificErrorCodes?: string[], specificAuthError?: AuthErrorCode): never {
  throw toAuthError(error, specificErrorCodes, specificAuthError);
}

export function initializeAuth(firebaseApp: FirebaseApp, settings?: FirebaseAuthSettings): void {
  const persistence = settings?.persistence || [indexedDBLocalPersistence, browserLocalPersistence];
  const resolver = settings?.popupRedirectResolver || browserPopupRedirectResolver;

  state.unsubscribeAuthStateChanged?.();
  state.unsubscribeLoadUser?.();

  state.auth = initializeFirebaseAuth(firebaseApp, {
    persistence,
    popupRedirectResolver: resolver,
  });
  state.resolver = resolver;

  if (settings?.emulatorUrl) {
    connectAuthEmulator(state.auth, settings.emulatorUrl);
  }

  state.unsubscribeAuthStateChanged = state.auth.onAuthStateChanged((user) => {
    syncPreferredLanguageFromUser(user);
    notifyUserChange(user);
  });

  state.redirectAuthError = getRedirectResult(state.auth, resolver).then(
    () => null,
    (error: unknown) => toAuthError(error, accountLinkingErrorCodes, AuthErrorCode.AccountLinkingRequired)
  );
}

export function getFirebaseAuth(): Auth {
  return getAuth();
}

/** Return an Auth error produced when Firebase completes a redirect sign-in. */
export async function getRedirectAuthError(): Promise<AuthError | null> {
  return state.redirectAuthError ?? null;
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

export async function setSessionPersistence(rememberMe: boolean): Promise<void> {
  try {
    await setPersistence(getAuth(), rememberMe ? browserLocalPersistence : browserSessionPersistence);
  } catch (error: unknown) {
    handleAuthError(error);
  }
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

    if (!credential.user.emailVerified) {
      await auth.signOut();
      throw new AuthError(AuthErrorCode.EmailNotVerified);
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw error;
    }
    handleAuthError(
      error,
      [AuthErrorCodes.USER_DELETED, AuthErrorCodes.INVALID_PASSWORD],
      AuthErrorCode.InvalidCredentials
    );
  }
}

export async function signInWithCustomToken(token: string): Promise<void> {
  const auth = getAuth();

  try {
    await firebaseSignInWithCustomToken(auth, token);
  } catch (error: unknown) {
    handleAuthError(error, [AuthErrorCodes.INVALID_CUSTOM_TOKEN], AuthErrorCode.InvalidCredentials);
  }
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
      handleAuthError(error, accountLinkingErrorCodes, AuthErrorCode.AccountLinkingRequired);
    }
    return;
  }

  try {
    await signInWithRedirect(auth, provider, resolver);
  } catch (error: unknown) {
    handleAuthError(error, accountLinkingErrorCodes, AuthErrorCode.AccountLinkingRequired);
  }
}

export async function signOut(): Promise<void> {
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

export async function loadUser(): Promise<User | null> {
  const auth = getAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  state.isLoadingState = true;

  await new Promise((resolve) => {
    state.unsubscribeLoadUser?.();
    state.unsubscribeLoadUser = auth.onAuthStateChanged((user) => {
      state.unsubscribeLoadUser?.();
      state.unsubscribeLoadUser = undefined;
      resolve(user);
    });
  });

  state.isLoadingState = false;

  return auth.currentUser;
}

export function destroy(): void {
  state.unsubscribeAuthStateChanged?.();
  state.unsubscribeLoadUser?.();
  state.unsubscribeAuthStateChanged = undefined;
  state.unsubscribeLoadUser = undefined;
  state.auth = undefined;
  state.resolver = undefined;
  state.redirectAuthError = undefined;
  state.currentUserValue = undefined;
}
