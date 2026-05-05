import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

/**
 * Generates a 24-char (≈120-bit) random ID, suitable for primary keys.
 */
export function newId(): string {
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}
