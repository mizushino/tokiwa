import type { FirebaseApp } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';

/**
 * Global Firebase Functions instance.
 * Initialized by initializeFunctions().
 */
export let firebaseFunctions: Functions;

/**
 * Configuration options for Firebase Functions.
 */
export interface FunctionsSettings {
  /** Cloud Functions region (e.g., 'asia-northeast1') */
  region?: string;
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

  // Connect to emulator only when explicitly enabled
  // (Production Firebase Functions are used by default)
  if (useEmulator) {
    connectFunctionsEmulator(firebaseFunctions, 'localhost', 5001);
  }

  return firebaseFunctions;
}

/**
 * Create a callable function client.
 *
 * Returns a function that calls the specified Firebase Callable Function.
 * Errors are logged and null is returned on failure.
 *
 * @param name - Cloud Function name
 * @returns Function that calls the Cloud Function with typed request/response
 *
 * @example
 * ```ts
 * const myFunction = callFirebaseFunction<RequestType, ResponseType>('myFunction');
 * const result = await myFunction({ foo: 'bar' });
 * ```
 */
export function callFirebaseFunction<T, U>(name: string): (data: T) => Promise<U | null> {
  return async (data: T) => {
    try {
      const callable = httpsCallable<T, U>(firebaseFunctions, name);
      const result = await callable(data);
      return result?.data ?? null;
    } catch (e) {
      console.warn(e);
    }

    return null;
  };
}
