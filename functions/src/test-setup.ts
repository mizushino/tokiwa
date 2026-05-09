import { existsSync } from 'fs';
import { setGlobalOptions } from 'firebase-functions/v2/options';

// Load environment variables from .env file when present.
if (existsSync('.env')) {
  process.loadEnvFile?.();
}

// Set global options for Firebase Functions
setGlobalOptions({
  region: 'asia-northeast1',
});

// Wait for emulators to be ready
export async function setup(): Promise<void> {
  // Give emulators time to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
