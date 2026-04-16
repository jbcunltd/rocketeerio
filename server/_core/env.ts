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
  // APP_URL: Always use rocketeerio.com in production, never fall back to VERCEL_URL
  appUrl: ((process.env.APP_URL?.trim() || "") && !process.env.APP_URL?.includes("vercel.app")) ? process.env.APP_URL!.trim().replace(/\/+$/, "") : "https://rocketeerio.com",
  // PayMongo
  paymongoSecretKey: process.env.PAYMONGO_SECRET_KEY ?? "sk_test_placeholder",
  paymongoPublicKey: process.env.PAYMONGO_PUBLIC_KEY ?? "pk_test_placeholder",
};
