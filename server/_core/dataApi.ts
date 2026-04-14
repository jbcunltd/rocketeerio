/**
 * Data API helper — stub implementation.
 * The original Manus WebDev proxy API has been removed.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  console.warn("[DataApi] callDataApi called but no backend is configured. ApiId:", apiId);
  return null;
}
