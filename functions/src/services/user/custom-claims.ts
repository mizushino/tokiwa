import type { UserData } from '@firestore/types/user.js';

export const MAX_CUSTOM_CLAIMS_BYTES = 1_000;

export interface UserCustomClaims {
  p: NonNullable<UserData['permissions']>;
  a: boolean;
}

export class CustomClaimsTooLargeError extends Error {
  public readonly code = 'auth/claims-too-large';

  public constructor(size: number) {
    super(`Custom claims payload is ${size} bytes; the maximum is ${MAX_CUSTOM_CLAIMS_BYTES} bytes.`);
    this.name = 'CustomClaimsTooLargeError';
  }
}

export function getCustomUserClaims(user: UserData): UserCustomClaims {
  const claims = { p: user.permissions ?? {}, a: user.admin ?? false };
  const size = Buffer.byteLength(JSON.stringify(claims), 'utf8');
  if (size > MAX_CUSTOM_CLAIMS_BYTES) {
    throw new CustomClaimsTooLargeError(size);
  }
  return claims;
}
