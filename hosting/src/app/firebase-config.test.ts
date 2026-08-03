import { describe, expect, it } from 'vite-plus/test';

import { allowsDemoFirebaseConfig, getFirebaseConfig } from './firebase-config.js';

describe('Firebase config', () => {
  it.each(['dev', 'development', 'emulator', 'test'])('allows demo config in %s mode', (mode) => {
    expect(allowsDemoFirebaseConfig(mode)).toBe(true);
    expect(getFirebaseConfig({}, { allowDemoFallback: allowsDemoFirebaseConfig(mode) }).projectId).toBe(
      'tokiwa-template'
    );
  });

  it.each(['production', 'prod', 'staging'])('requires explicit config in %s mode', (mode) => {
    expect(allowsDemoFirebaseConfig(mode)).toBe(false);
    expect(() => getFirebaseConfig({}, { allowDemoFallback: allowsDemoFirebaseConfig(mode) })).toThrow(
      'Missing Firebase config'
    );
  });
});
