import type { FirebaseApp } from 'firebase/app';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';

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

export function callFirebaseFunction<T, U>(name: string): (data: T) => Promise<U | null> {
  return async (data: T) => {
    try {
      const callable = httpsCallable<T, U>(getInitializedFunctions(), name);
      const result = await callable(data);
      return result?.data ?? null;
    } catch (e) {
      console.warn(e);
    }

    return null;
  };
}
