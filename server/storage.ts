/**
 * Storage helpers — stub implementation.
 *
 * The original Manus Forge storage proxy has been removed.
 * Replace with Supabase Storage, S3, or another provider as needed.
 */

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  console.warn("[Storage] storagePut called but no storage backend is configured. Key:", relKey);
  // Return a placeholder — callers should handle gracefully
  return { key: relKey, url: "" };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  console.warn("[Storage] storageGet called but no storage backend is configured. Key:", relKey);
  return { key: relKey, url: "" };
}
