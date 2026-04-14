export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "jandrickclimaco@gmail.com",
  isProduction: process.env.NODE_ENV === "production",
  // Facebook / Meta
  facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
  facebookVerifyToken: process.env.FACEBOOK_VERIFY_TOKEN ?? "rocketeer_verify_token_2024",
  appUrl: process.env.APP_URL ?? "https://rocketeerio.vercel.app",
};
