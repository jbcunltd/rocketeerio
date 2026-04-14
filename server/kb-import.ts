import type { Express, Request, Response } from "express";
import multer from "multer";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { crawlWebsite, structurePdfContent } from "./website-crawler";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

async function authenticateRequest(req: Request): Promise<number | null> {
  const cookies = req.headers.cookie || "";
  const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
  const token = sessionCookie?.split("=")[1];
  const session = await sdk.verifySession(token);
  return session?.userId ?? null;
}

/**
 * pdf-parse v1.1.1 has a bug: when loaded as a non-main module it still
 * tries to read a test PDF from disk (`./test/data/05-versions-space.pdf`).
 * On Vercel the file doesn't exist, so the import crashes the entire
 * serverless function.  We work around this by importing the inner
 * `lib/pdf-parse.js` directly, which is the actual parser without the
 * test-file side-effect.
 */
async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  // pdf-parse/lib/pdf-parse.js is the real implementation without the
  // auto-test side effect that crashes on Vercel
  const pdfParseFn = (await import("pdf-parse/lib/pdf-parse.js")).default ?? (await import("pdf-parse/lib/pdf-parse.js"));
  return pdfParseFn(buffer);
}

export function registerKbImportRoutes(app: Express) {

  // ─── Website Crawl Import ──────────────────────────────────────────
  app.post("/api/kb/import-website", async (req: Request, res: Response) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`[KB Import] Crawling website: ${url} for user ${userId}`);

      const result = await crawlWebsite(url);

      if (result.entries.length === 0) {
        return res.json({
          success: true,
          entries: [],
          pagesScraped: result.pagesScraped,
          message: "No content could be extracted from the website.",
        });
      }

      // Save entries to database
      const savedEntries = [];
      for (const entry of result.entries) {
        const id = await db.createKnowledgeEntry({
          userId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source: "website",
          sourceUrl: url,
        });
        if (id) {
          savedEntries.push({ id, ...entry });
        }
      }

      console.log(`[KB Import] Saved ${savedEntries.length} entries from ${result.pagesScraped} pages`);

      return res.json({
        success: true,
        entries: savedEntries,
        pagesScraped: result.pagesScraped,
        message: `Extracted ${savedEntries.length} entries from ${result.pagesScraped} pages.`,
      });
    } catch (error) {
      console.error("[KB Import] Website crawl error:", error);
      return res.status(500).json({ error: "Failed to crawl website" });
    }
  });

  // ─── PDF Upload Import ─────────────────────────────────────────────
  app.post("/api/kb/import-pdf", upload.single("pdf"), async (req: Request, res: Response) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      console.log(`[KB Import] Processing PDF: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB) for user ${userId}`);

      // Extract text from PDF
      const pdfData = await parsePdf(file.buffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length < 20) {
        return res.json({
          success: true,
          entries: [],
          message: "Could not extract meaningful text from the PDF. It may be image-based.",
        });
      }

      // Structure the content using AI
      const result = await structurePdfContent(pdfText, file.originalname);

      if (result.entries.length === 0) {
        return res.json({
          success: true,
          entries: [],
          message: "No structured content could be extracted from the PDF.",
        });
      }

      // Save entries to database
      const savedEntries = [];
      for (const entry of result.entries) {
        const id = await db.createKnowledgeEntry({
          userId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source: "pdf",
          sourceUrl: file.originalname,
        });
        if (id) {
          savedEntries.push({ id, ...entry });
        }
      }

      console.log(`[KB Import] Saved ${savedEntries.length} entries from PDF: ${file.originalname}`);

      return res.json({
        success: true,
        entries: savedEntries,
        message: `Extracted ${savedEntries.length} entries from "${file.originalname}".`,
      });
    } catch (error) {
      console.error("[KB Import] PDF import error:", error);
      return res.status(500).json({ error: "Failed to process PDF" });
    }
  });
}
