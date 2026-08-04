import type { FirebaseApp } from 'firebase/app';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { initializeAnalyticsIfSupported } from './analytics';

const analyticsMocks = vi.hoisted(() => ({
  initializeAnalytics: vi.fn(),
  isSupported: vi.fn(),
}));

vi.mock('firebase/analytics', () => analyticsMocks);

describe('initializeAnalyticsIfSupported', () => {
  const app = {} as FirebaseApp;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('initializes Analytics when the environment is supported', async () => {
    const analytics = { app };
    analyticsMocks.isSupported.mockResolvedValue(true);
    analyticsMocks.initializeAnalytics.mockReturnValue(analytics);

    await expect(initializeAnalyticsIfSupported(app)).resolves.toBe(analytics);
    expect(analyticsMocks.initializeAnalytics).toHaveBeenCalledWith(app);
  });

  it('does not initialize Analytics when the environment is unsupported', async () => {
    analyticsMocks.isSupported.mockResolvedValue(false);

    await expect(initializeAnalyticsIfSupported(app)).resolves.toBeUndefined();
    expect(analyticsMocks.initializeAnalytics).not.toHaveBeenCalled();
  });

  it('handles support detection failures', async () => {
    const error = new Error('IndexedDB unavailable');
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    analyticsMocks.isSupported.mockRejectedValue(error);

    await expect(initializeAnalyticsIfSupported(app)).resolves.toBeUndefined();
    expect(warningSpy).toHaveBeenCalledWith('Firebase Analytics initialization skipped:', error);
    expect(analyticsMocks.initializeAnalytics).not.toHaveBeenCalled();
  });
});
