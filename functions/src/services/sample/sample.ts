import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { SampleDocument } from 'src/models/sample.js';
import { region } from 'src/options.js';
import type { SampleRunRequest, SampleRunResponse } from 'src/types/sample.js';

/** Minimal callable-request shape accepted by {@link runHandler} */
interface SampleRunHandlerRequest {
  data: SampleRunRequest;
}

const SAMPLE_ID = 'sample';
const MAX_SAMPLE_NAME_LENGTH = 100;

/**
 * Upserts a sample document and increments its counter
 * Exported for testing purposes
 * @param request - Callable request containing the sample id and name
 * @returns The saved sample's id, name, and updated count
 */
export async function runHandler(request: SampleRunHandlerRequest): Promise<SampleRunResponse> {
  if (typeof request.data?.id !== 'string' || request.data.id.trim() !== SAMPLE_ID) {
    throw new HttpsError('invalid-argument', `id must be ${SAMPLE_ID}`);
  }

  if (typeof request.data?.name !== 'string') {
    throw new HttpsError('invalid-argument', 'name is required');
  }

  const id = SAMPLE_ID;
  const name = request.data.name.trim();
  if (!name) {
    throw new HttpsError('invalid-argument', 'name is required');
  }
  if (name.length > MAX_SAMPLE_NAME_LENGTH) {
    throw new HttpsError('invalid-argument', `name must be at most ${MAX_SAMPLE_NAME_LENGTH} characters`);
  }

  return getFirestore().runTransaction(async (transaction) => {
    const sampleDocument = new SampleDocument({ id });
    await sampleDocument.get(transaction);

    const baseData = sampleDocument.exists ? sampleDocument.data : SampleDocument.defaultData;
    const updatedDocument = new SampleDocument({ id }, { ...baseData, name, count: baseData.count + 1 });
    await updatedDocument.save(false, transaction);

    return {
      id,
      name: updatedDocument.data.name,
      count: updatedDocument.data.count,
    };
  });
}

/**
 * Callable function that upserts a sample document and increments its counter
 * Used as a template for creating new callable functions
 */
export const run = onCall<SampleRunRequest, Promise<SampleRunResponse>>({ region }, runHandler);
