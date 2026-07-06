/**
 * Repeatedly runs an assertion until it stops throwing or the attempts run out.
 *
 * Used by emulator-based trigger tests to wait for asynchronous side effects.
 */
export async function waitForCondition(
  assertion: () => Promise<void> | void,
  attempts = 40,
  delayMs = 100
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
