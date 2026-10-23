/** Persist a printer only after its defined test-print operation succeeds. */
export async function persistPrinterAfterSuccessfulTest<T>(
  printer: T,
  sendTest: () => Promise<void>,
  persist: () => Promise<void>,
): Promise<T> {
  await sendTest();
  await persist();
  return printer;
}
