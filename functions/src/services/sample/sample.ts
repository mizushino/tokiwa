import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { SampleDocument } from 'src/models/sample.js';
import type { SampleRunRequest, SampleRunResponse } from 'src/types/sample.js';

/** Minimal callable-request shape accepted by {@link runHandler} */
interface SampleRunHandlerRequest {
  data: SampleRunRequest;
}

/**
 * Upserts a sample document and increments its counter
 * Exported for testing purposes
 * @param request - Callable request containing the sample id and name
 * @returns The saved sample's id, name, and updated count
 */
export async function runHandler(request: SampleRunHandlerRequest): Promise<SampleRunResponse> {
  const id = request.data.id.trim();
  const name = request.data.name.trim();

  if (!id) {
    throw new HttpsError('invalid-argument', 'id is required');
  }

  if (!name) {
    throw new HttpsError('invalid-argument', 'name is required');
  }

  const sampleDocument = new SampleDocument({ id });
  await sampleDocument.get();

  const nextData = sampleDocument.exists
    ? {
        ...sampleDocument.data,
        name,
        count: sampleDocument.data.count + 1,
      }
    : {
        ...SampleDocument.defaultData,
        name,
        count: 1,
      };

  const updatedDocument = new SampleDocument({ id }, nextData);
  await updatedDocument.save();

  return {
    id,
    name: updatedDocument.data.name,
    count: updatedDocument.data.count,
  };
}

/**
 * Callable function that upserts a sample document and increments its counter
 * Used as a template for creating new callable functions
 */
export const run = onCall<SampleRunRequest, Promise<SampleRunResponse>>({ region: 'asia-northeast1' }, runHandler);
