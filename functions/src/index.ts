import { getApps, initializeApp } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}

export * as user from './services/user/user.js';

export * as project from './services/project/project.js';

export * as storage from './services/storage/storage.js';
