export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the login page URL.
 * After the auth migration to email/password,
 * this simply returns the root path where the login form lives.
 */
export const getLoginUrl = (_returnPath: string = "/dashboard") => {
  return "/";
};
