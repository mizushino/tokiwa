import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// User triggers (Auth sync and custom claims)
export * as user from './services/user/user.js';

// Project triggers (Permission management)
export * as project from './services/project/project.js';

// Storage triggers (File processing)
export * as storage from './services/storage/storage.js';
