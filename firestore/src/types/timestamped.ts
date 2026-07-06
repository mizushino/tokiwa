/**
 * Timestamp fields shared by every Firestore document type in this project.
 */
export interface TimestampedData {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns fresh creation/update timestamps for use in `defaultData`.
 */
export function timestampDefaults(): TimestampedData {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
  };
}
