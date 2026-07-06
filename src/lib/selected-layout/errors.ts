export function isMissingSelectedLayoutTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { code?: unknown; message?: unknown };
  return maybeError.code === "42P01";
}
