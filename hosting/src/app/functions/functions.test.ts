import type { FirebaseApp } from 'firebase/app';
import { FunctionsError } from 'firebase/functions';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { callFirebaseFunction, initializeFunctions, type CallableDiagnostic, type CallableResult } from './functions';

const firebaseMocks = vi.hoisted(() => ({
  callable: vi.fn(),
  connectFunctionsEmulator: vi.fn(),
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock('firebase/functions', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('firebase/functions');
  return {
    ...actual,
    connectFunctionsEmulator: firebaseMocks.connectFunctionsEmulator,
    getFunctions: firebaseMocks.getFunctions,
    httpsCallable: firebaseMocks.httpsCallable,
  };
});

function getFailure<T>(result: CallableResult<T>): CallableDiagnostic {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error('Expected callable failure');
  }
  return result.error;
}

describe('Firebase callable adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseMocks.getFunctions.mockReturnValue({});
    firebaseMocks.httpsCallable.mockReturnValue(firebaseMocks.callable);
    initializeFunctions({} as FirebaseApp);
  });

  it('returns successful data as a discriminated result', async () => {
    firebaseMocks.callable.mockResolvedValue({ data: { value: 42 } });
    const call = callFirebaseFunction<{ id: string }, { value: number }>('sample-run');

    await expect(call({ id: 'sample' })).resolves.toEqual({ ok: true, data: { value: 42 } });
    expect(firebaseMocks.httpsCallable).toHaveBeenCalledWith(expect.anything(), 'sample-run');
  });

  it('preserves Firebase diagnostics and marks unavailable as retryable', async () => {
    const details = { reason: 'maintenance' };
    firebaseMocks.callable.mockRejectedValue(new FunctionsError('unavailable', 'Temporarily unavailable', details));
    const call = callFirebaseFunction<Record<string, never>, null>('sample-run');

    await expect(call({})).resolves.toEqual({
      ok: false,
      error: {
        code: 'functions/unavailable',
        message: 'Temporarily unavailable',
        details,
        retryable: true,
      },
    });
  });

  it('marks validation failures as non-retryable', async () => {
    firebaseMocks.callable.mockRejectedValue(new FunctionsError('invalid-argument', 'id is required'));
    const call = callFirebaseFunction<Record<string, never>, null>('sample-run');

    expect(getFailure(await call({}))).toEqual({
      code: 'functions/invalid-argument',
      message: 'id is required',
      details: undefined,
      retryable: false,
    });
  });

  it('does not suggest retrying a deadline-exceeded mutation', async () => {
    firebaseMocks.callable.mockRejectedValue(new FunctionsError('deadline-exceeded', 'Timed out'));
    const call = callFirebaseFunction<Record<string, never>, null>('sample-run');

    expect(getFailure(await call({})).retryable).toBe(false);
  });

  it('converts unexpected failures instead of swallowing them', async () => {
    firebaseMocks.callable.mockRejectedValue(new Error('Initialization failed'));
    const call = callFirebaseFunction<Record<string, never>, null>('sample-run');

    expect(getFailure(await call({}))).toEqual({
      code: 'functions/unknown',
      message: 'Initialization failed',
      retryable: false,
    });
  });
});
