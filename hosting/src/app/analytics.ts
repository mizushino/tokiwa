import { initializeAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import type { FirebaseApp } from 'firebase/app';

/** Initialize Firebase Analytics only when the current browser supports it. */
export async function initializeAnalyticsIfSupported(app: FirebaseApp): Promise<Analytics | undefined> {
  try {
    if (await isSupported()) {
      return initializeAnalytics(app);
    }
  } catch (error) {
    console.warn('Firebase Analytics initialization skipped:', error);
  }

  return undefined;
}
