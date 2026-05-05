import { Facebook } from "arctic";

export const FB_LOGIN_SCOPES = ["email", "public_profile"];

export const FB_PAGES_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
  "business_management",
];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[facebook] Missing required environment variable: ${name}`,
    );
  }
  return v;
}

export function getLoginClient(): Facebook {
  return new Facebook(
    requireEnv("FACEBOOK_APP_ID"),
    requireEnv("FACEBOOK_APP_SECRET"),
    requireEnv("FACEBOOK_LOGIN_REDIRECT_URI"),
  );
}

export function getPagesClient(): Facebook {
  return new Facebook(
    requireEnv("FACEBOOK_APP_ID"),
    requireEnv("FACEBOOK_APP_SECRET"),
    requireEnv("FACEBOOK_PAGES_REDIRECT_URI"),
  );
}

export interface FacebookGraphUser {
  id: string;
  name: string;
  email?: string;
  picture?: { data: { url: string } };
}

export async function fetchFacebookUser(
  accessToken: string,
): Promise<FacebookGraphUser> {
  const url = new URL("https://graph.facebook.com/v21.0/me");
  url.searchParams.set("fields", "id,name,email,picture");
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `[facebook] /me failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  return (await res.json()) as FacebookGraphUser;
}

export interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  access_token: string;
  tasks?: string[];
  picture?: { data: { url: string } };
}

interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: { next?: string };
}

export async function fetchUserPages(
  userAccessToken: string,
): Promise<FacebookPage[]> {
  const url = new URL("https://graph.facebook.com/v21.0/me/accounts");
  url.searchParams.set(
    "fields",
    "id,name,category,access_token,tasks,picture{url}",
  );
  url.searchParams.set("access_token", userAccessToken);
  url.searchParams.set("limit", "100");

  const pages: FacebookPage[] = [];
  let next: string | undefined = url.toString();
  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(
        `[facebook] /me/accounts failed: ${res.status} ${await res.text().catch(() => "")}`,
      );
    }
    const json = (await res.json()) as FacebookPagesResponse;
    pages.push(...json.data);
    next = json.paging?.next;
  }
  return pages;
}

/**
 * Exchange a short-lived user token for a long-lived (~60 day) one.
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", requireEnv("FACEBOOK_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("FACEBOOK_APP_SECRET"));
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `[facebook] long-lived exchange failed: ${res.status} ${await res.text().catch(() => "")}`,
    );
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  return { accessToken: json.access_token, expiresIn: json.expires_in };
}
