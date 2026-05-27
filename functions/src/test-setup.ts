import { existsSync } from 'fs';

import { setGlobalOptions } from 'firebase-functions/v2/options';

if (existsSync('.env')) {
  process.loadEnvFile?.();
}

setGlobalOptions({
  region: 'asia-northeast1',
});

export async function setup(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
