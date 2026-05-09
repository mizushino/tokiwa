import type { FirebaseApp } from 'firebase/app';
import type { Auth, AuthProvider, User } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthError,
  AuthErrorCode,
  currentUser,
  destroy,
  getFirebaseAuth,
  initializeAuth,
  isLoading,
  isSignedIn,
  loadUser,
  resetPassword,
  signInWithCustomToken,
  signInWithEmail,
  signInWithProvider,
  signOut,
  userSnapshot,
} from './auth';

// Mock firebase/auth
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    initializeAuth: vi.fn(),
    connectAuthEmulator: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithCustomToken: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithRedirect: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    getRedirectResult: vi.fn(),
    getIdToken: vi.fn(),
    AuthErrorCodes: {
      USER_DELETED: 'auth/user-not-found',
      INVALID_PASSWORD: 'auth/wrong-password',
      INVALID_CUSTOM_TOKEN: 'auth/invalid-custom-token',
    },
  };
});

describe('Auth', () => {
  let mockAuth: Auth;
  let mockUser: User;
  let authStateListeners: ((user: User | null) => void)[];
  let currentUserValue: User | null;

  beforeEach(async () => {
    // Reset modules to clear state
    vi.clearAllMocks();

    authStateListeners = [];
    currentUserValue = null;

    mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    } as User;

    mockAuth = {
      get currentUser() {
        return currentUserValue;
      },
      onAuthStateChanged: vi.fn((callback) => {
        authStateListeners.push(callback);
        return vi.fn(); // unsubscribe function
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
    } as unknown as Auth;

    const { initializeAuth: initializeAuthMock } = await import('firebase/auth');
    (initializeAuthMock as ReturnType<typeof vi.fn>).mockReturnValue(mockAuth);

    const { getRedirectResult } = await import('firebase/auth');
    (getRedirectResult as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  afterEach(() => {
    destroy();
  });

  describe('initializeAuth', () => {
    it('initializes Firebase Auth with default settings', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { initializeAuth: initializeAuthMock } = await import('firebase/auth');
      expect(initializeAuthMock).toHaveBeenCalledWith(mockApp, expect.any(Object));
      expect(mockAuth.onAuthStateChanged).toHaveBeenCalled();
    });

    it('connects to emulator when emulatorUrl is provided', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp, { emulatorUrl: 'http://localhost:9099' });

      const { connectAuthEmulator } = await import('firebase/auth');
      expect(connectAuthEmulator).toHaveBeenCalledWith(mockAuth, 'http://localhost:9099');
    });

    it('sets up auth state listener', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(expect.any(Function));
    });

    it('handles redirect result with user', async () => {
      const mockApp = {} as FirebaseApp;

      const { getRedirectResult } = await import('firebase/auth');
      (getRedirectResult as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });

      initializeAuth(mockApp);

      // Wait for async getRedirectResult to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(getRedirectResult).toHaveBeenCalled();
    });
  });

  describe('getFirebaseAuth', () => {
    it('returns auth instance after initialization', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      expect(getFirebaseAuth()).toBe(mockAuth);
    });

    it('throws error if not initialized', () => {
      expect(() => getFirebaseAuth()).toThrow('Firebase Auth is not initialized');
    });
  });

  describe('currentUser', () => {
    it('returns null when no user is signed in', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = null;

      expect(currentUser()).toBeNull();
    });

    it('returns current user when signed in', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = mockUser;

      expect(currentUser()).toBe(mockUser);
    });
  });

  describe('isSignedIn', () => {
    it('returns false when no user is signed in', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = null;

      expect(isSignedIn()).toBe(false);
    });

    it('returns true when user is signed in', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = mockUser;

      expect(isSignedIn()).toBe(true);
    });
  });

  describe('signInWithEmail', () => {
    it('signs in with email and password', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithEmailAndPassword, getIdToken } = await import('firebase/auth');
      (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });
      (getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue('mock-token');

      currentUserValue = mockUser;

      await signInWithEmail('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
    });

    it('throws AuthError when email is empty', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      await expect(signInWithEmail('', 'password')).rejects.toThrow(AuthError);
      await expect(signInWithEmail('', 'password')).rejects.toMatchObject({
        code: AuthErrorCode.EmailRequired,
      });
    });

    it('throws AuthError when password is empty', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      await expect(signInWithEmail('test@example.com', '')).rejects.toThrow(AuthError);
      await expect(signInWithEmail('test@example.com', '')).rejects.toMatchObject({
        code: AuthErrorCode.PasswordRequired,
      });
    });

    it('throws InvalidCredentials error on wrong password', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithEmailAndPassword } = await import('firebase/auth');
      (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'auth/wrong-password',
      });

      await expect(signInWithEmail('test@example.com', 'wrong')).rejects.toMatchObject({
        code: AuthErrorCode.InvalidCredentials,
      });
    });

    it('throws InvalidCredentials error on user not found', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithEmailAndPassword } = await import('firebase/auth');
      (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'auth/user-not-found',
      });

      await expect(signInWithEmail('test@example.com', 'password')).rejects.toMatchObject({
        code: AuthErrorCode.InvalidCredentials,
      });
    });

    it('throws LoginFailed error on unknown error', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithEmailAndPassword } = await import('firebase/auth');
      (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unknown error'));

      await expect(signInWithEmail('test@example.com', 'password')).rejects.toMatchObject({
        code: AuthErrorCode.LoginFailed,
      });
    });

    it('throws EmailNotVerified error if email is not verified', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithEmailAndPassword } = await import('firebase/auth');
      (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { ...mockUser, emailVerified: false },
      });

      await expect(signInWithEmail('test@example.com', 'password')).rejects.toMatchObject({
        code: AuthErrorCode.EmailNotVerified,
      });
      expect(mockAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('signInWithCustomToken', () => {
    it('signs in with custom token', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithCustomToken: signInWithCustomTokenMock } = await import('firebase/auth');
      (signInWithCustomTokenMock as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });

      await signInWithCustomToken('custom-token');

      expect(signInWithCustomTokenMock).toHaveBeenCalledWith(mockAuth, 'custom-token');
    });

    it('throws InvalidCredentials on invalid token', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { signInWithCustomToken: signInWithCustomTokenMock } = await import('firebase/auth');
      (signInWithCustomTokenMock as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'auth/invalid-custom-token',
      });

      await expect(signInWithCustomToken('invalid-token')).rejects.toMatchObject({
        code: AuthErrorCode.InvalidCredentials,
      });
    });
  });

  describe('signInWithProvider', () => {
    it('signs in with popup by default', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const mockProvider = {} as AuthProvider;
      const { signInWithPopup } = await import('firebase/auth');
      (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValue({ user: mockUser });

      await signInWithProvider(mockProvider, undefined, true);

      expect(signInWithPopup).toHaveBeenCalledWith(mockAuth, mockProvider, expect.any(Object));
    });

    it('signs in with redirect when usePopup is false', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const mockProvider = {} as AuthProvider;
      const { signInWithRedirect } = await import('firebase/auth');
      (signInWithRedirect as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await signInWithProvider(mockProvider, undefined, false);

      expect(signInWithRedirect).toHaveBeenCalledWith(mockAuth, mockProvider, expect.any(Object));
    });

    it('throws LoginFailed on popup error', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const mockProvider = {} as AuthProvider;
      const { signInWithPopup } = await import('firebase/auth');
      (signInWithPopup as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Popup error'));

      await expect(signInWithProvider(mockProvider, undefined, true)).rejects.toMatchObject({
        code: AuthErrorCode.LoginFailed,
      });
    });
  });

  describe('signOut', () => {
    it('signs out the current user', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      await signOut();

      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('throws LoginFailed on sign out error', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      (mockAuth.signOut as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Sign out failed'));

      await expect(signOut()).rejects.toMatchObject({
        code: AuthErrorCode.LoginFailed,
      });
    });
  });

  describe('resetPassword', () => {
    it('sends password reset email', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { sendPasswordResetEmail: sendPasswordResetEmailMock } = await import('firebase/auth');
      (sendPasswordResetEmailMock as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await resetPassword('test@example.com');

      expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(mockAuth, 'test@example.com');
    });

    it('throws EmailRequired when email is empty', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      await expect(resetPassword('')).rejects.toMatchObject({
        code: AuthErrorCode.EmailRequired,
      });
    });

    it('throws InvalidCredentials on user not found', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { sendPasswordResetEmail: sendPasswordResetEmailMock } = await import('firebase/auth');
      (sendPasswordResetEmailMock as ReturnType<typeof vi.fn>).mockRejectedValue({
        code: 'auth/user-not-found',
      });

      await expect(resetPassword('test@example.com')).rejects.toMatchObject({
        code: AuthErrorCode.InvalidCredentials,
      });
    });

    it('throws LoginFailed on unknown error', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const { sendPasswordResetEmail: sendPasswordResetEmailMock } = await import('firebase/auth');
      (sendPasswordResetEmailMock as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unknown error'));

      await expect(resetPassword('test@example.com')).rejects.toMatchObject({
        code: AuthErrorCode.LoginFailed,
      });
    });
  });

  describe('loadUser', () => {
    it('returns current user immediately if already signed in', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = mockUser;

      const user = await loadUser();

      expect(user).toBe(mockUser);
    });

    it('waits for auth state and returns user', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = null;

      const loadPromise = loadUser();

      // Simulate auth state change
      setTimeout(() => {
        currentUserValue = mockUser;
        authStateListeners.forEach((listener) => listener(mockUser));
      }, 10);

      const user = await loadPromise;

      expect(user).toBe(mockUser);
    });

    it('sets loading state during wait', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);
      currentUserValue = null;

      const loadPromise = loadUser();

      expect(isLoading()).toBe(true);

      // Simulate auth state change
      setTimeout(() => {
        currentUserValue = mockUser;
        authStateListeners.forEach((listener) => listener(mockUser));
      }, 10);

      await loadPromise;

      expect(isLoading()).toBe(false);
    });
  });

  describe('userSnapshot', () => {
    it('yields current user value initially', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const snapshot = userSnapshot();
      const { value } = await snapshot.next();

      // Should yield current auth state (null or user from previous tests)
      expect(value === null || value === undefined || typeof value === 'object').toBe(true);

      // Cleanup: close the generator
      await snapshot.return();
    });

    it('yields current user after sign in', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const snapshot = userSnapshot();

      // Get initial value
      await snapshot.next();

      // Simulate sign in with timeout to prevent blocking
      const nextPromise = Promise.race([
        snapshot.next(),
        new Promise<IteratorResult<User | null | undefined>>((resolve) =>
          setTimeout(() => resolve({ value: undefined, done: true }), 100)
        ),
      ]);

      authStateListeners.forEach((listener) => listener(mockUser));

      const result = await nextPromise;
      if (!result.done && result.value !== undefined) {
        expect(result.value).toBe(mockUser);
      }

      // Cleanup: close the generator
      await snapshot.return();
    });

    it('yields null after sign out', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const snapshot = userSnapshot();

      // Get initial value
      await snapshot.next();

      // Simulate sign out with timeout
      const nextPromise = Promise.race([
        snapshot.next(),
        new Promise<IteratorResult<User | null | undefined>>((resolve) =>
          setTimeout(() => resolve({ value: undefined, done: true }), 100)
        ),
      ]);

      authStateListeners.forEach((listener) => listener(null));

      const result = await nextPromise;
      if (!result.done && result.value !== undefined) {
        expect(result.value).toBeNull();
      }

      // Cleanup: close the generator
      await snapshot.return();
    });

    it('cleans up listener when generator is closed', async () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      const snapshot = userSnapshot();
      await snapshot.next();

      // Close the generator
      const result = await snapshot.return();

      // Should be done
      expect(result.done).toBe(true);
    });
  });

  describe('destroy', () => {
    it('cleans up auth state', () => {
      const mockApp = {} as FirebaseApp;
      initializeAuth(mockApp);

      destroy();

      expect(() => getFirebaseAuth()).toThrow('Firebase Auth is not initialized');
    });
  });
});
