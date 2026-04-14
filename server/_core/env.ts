export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "jandrickclimaco@gmail.com",
  isProduction: process.env.NODE_ENV === "production",
};
