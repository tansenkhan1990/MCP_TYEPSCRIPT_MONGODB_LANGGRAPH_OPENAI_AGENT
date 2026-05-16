export function toErrorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}
