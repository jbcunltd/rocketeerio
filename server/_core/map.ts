/**
 * Google Maps proxy — stub implementation.
 * The original Manus Forge maps proxy has been removed.
 * Replace with direct Google Maps API calls if needed.
 */

export async function makeRequest<T>(
  _endpoint: string,
  _params: Record<string, string> = {},
  _options: { method?: string; body?: unknown } = {}
): Promise<T> {
  console.warn("[Maps] makeRequest called but no backend is configured.");
  return {} as T;
}
