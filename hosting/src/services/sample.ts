import { callFirebaseFunction } from '@app/functions';
import type { SampleRunRequest, SampleRunResponse } from '@functions/types/sample';

export const sample = {
  run: callFirebaseFunction<SampleRunRequest, SampleRunResponse>('sample-run'),
};
