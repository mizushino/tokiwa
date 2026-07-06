import type { SampleData, SampleKey } from '@firestore/types/sample.js';

/**
 * Request payload for the sample `run` callable function.
 * Derived from the shared Firestore sample types to stay in lockstep.
 */
export type SampleRunRequest = SampleKey & Pick<SampleData, 'name'>;

/**
 * Response payload for the sample `run` callable function.
 * Derived from the shared Firestore sample types to stay in lockstep.
 */
export type SampleRunResponse = SampleKey & Pick<SampleData, 'name' | 'count'>;
