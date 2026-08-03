import type { FirebaseApp } from 'firebase/app';
import {
  connectFunctionsEmulator,
  FunctionsError,
  getFunctions,
  httpsCallable,
  type Functions,
  type FunctionsErrorCode,
} from 'firebase/functions';

let firebaseFunctions: Functions | undefined;

function getInitializedFunctions(): Functions {
  if (!firebaseFunctions) {
    throw new Error('Firebase Functions is not initialized. Call initializeFunctions first.');
  }
  return firebaseFunctions;
}

export interface FunctionsSettings {
  region?: string;
}

export interface CallableDiagnostic {
  code: FunctionsErrorCode;
  message: string;
  details?: unknown;
  retryable: boolean;
}

export type CallableResult<T> = { ok: true; data: T } | { ok: false; error: CallableDiagnostic };

/**
 * Convert Firebase's callable error into a stable diagnostic for UI and service layers.
 * Only `unavailable` is marked retryable by default. In particular, a timed-out
 * mutation may already have completed and must not be retried blindly.
 */
function toCallableDiagnostic(error: unknown): CallableDiagnostic {
  if (error instanceof FunctionsError) {
    const code = error.code as FunctionsErrorCode;
    return {
      code,
      message: error.message,
      details: error.details,
      retryable: code === 'functions/unavailable',
    };
  }

  return {
    code: 'functions/unknown',
    message: error instanceof Error ? error.message : 'Unknown callable function error',
    retryable: false,
  };
}

/**
 * Initialize Firebase Functions.
 *
 * Automatically connects to emulator when MODE=emulator.
 *
 * @param app - Firebase App instance
 * @param settings - Optional Functions configuration
 * @returns Initialized Functions instance
 */
export function initializeFunctions(app: FirebaseApp, settings?: FunctionsSettings): Functions {
  firebaseFunctions = settings?.region !== undefined ? getFunctions(app, settings.region) : getFunctions(app);

  const useEmulator = import.meta.env.MODE === 'emulator' || import.meta.env.VITE_USE_EMULATOR === 'true';

  if (useEmulator) {
    connectFunctionsEmulator(firebaseFunctions, 'localhost', 5001);
  }

  return firebaseFunctions;
}

export function callFirebaseFunction<T, U>(name: string): (data: T) => Promise<CallableResult<U>> {
  return async (data: T) => {
    try {
      const callable = httpsCallable<T, U>(getInitializedFunctions(), name);
      const result = await callable(data);
      return { ok: true, data: result.data };
    } catch (error) {
      return { ok: false, error: toCallableDiagnostic(error) };
    }
  };
}
