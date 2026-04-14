import type { Express } from "express";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { ENV } from "./env";

const BCRYPT_ROUNDS = 10;
const OWNER_EMAIL = ENV.ownerEmail;

export function registerAuthRoutes(app: Express) {
  // ─── Sign Up ────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Determine role: owner gets admin + scale plan
      const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();

      // Create user
      await db.upsertUser({
        email,
        passwordHash,
        name: name || email.split("@")[0],
        loginMethod: "email",
        role: isOwner ? "admin" : "user",
      });

      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      // If owner, set plan to scale (unlimited)
      if (isOwner) {
        await db.updateUserProfile(user.id, { plan: "scale" });
      }

      // Create session token
      const token = await sdk.createSessionToken(user.id, user.email, user.name || "");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);

      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Auth] Signup error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Sign In ────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last signed in
      await db.upsertUser({
        email: user.email,
        lastSignedIn: new Date(),
      });

      // Create session token
      const token = await sdk.createSessionToken(user.id, user.email, user.name || "");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);

      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
