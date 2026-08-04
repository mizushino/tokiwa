import { describe, expect, it, vi } from 'vite-plus/test';

import { type AdminIndex } from './index';

import './index';

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock('@app/auth', () => ({
  signOut: authMocks.signOut,
  subscribeUserState: vi.fn(() => vi.fn()),
}));

vi.mock('@models/user', () => ({
  subscribeToUserDocument: vi.fn(() => vi.fn()),
}));

describe('AdminIndex', () => {
  it('keeps the admin subscription active when sign-out fails', async () => {
    const element = document.createElement('admin-index') as AdminIndex;
    const unsubscribeUserDoc = vi.fn();
    const signOutError = new Error('sign-out failed');
    const internals = element as unknown as {
      handleUserClick: () => Promise<void>;
      unsubscribeUserDoc: (() => void) | null;
      subscribedUid: string | null;
    };
    internals.unsubscribeUserDoc = unsubscribeUserDoc;
    internals.subscribedUid = 'admin-1';
    authMocks.signOut.mockRejectedValueOnce(signOutError);

    await expect(internals.handleUserClick()).rejects.toBe(signOutError);

    expect(unsubscribeUserDoc).not.toHaveBeenCalled();
    expect(internals.subscribedUid).toBe('admin-1');
  });
});
