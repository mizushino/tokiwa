import { existsSync } from 'node:fs';

import { setGlobalOptions } from 'firebase-functions/v2/options';

import { region } from 'src/options.js';

if (existsSync('.env')) {
  process.loadEnvFile?.();
}

setGlobalOptions({
  region,
});

export async function setup(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
