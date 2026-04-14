import type { Express, Request, Response } from "express";
import multer from "multer";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { crawlWebsite, structureDocumentContent } from "./website-crawler";
import { invokeLLM } from "./_core/llm";

// Allowed MIME types for file upload
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Accepted: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG.`));
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
 * pdf-parse v1.1.1 workaround: import the inner lib to avoid test-file side-effect on Vercel.
 */
async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  const pdfParseFn = (await import("pdf-parse/lib/pdf-parse.js")).default ?? (await import("pdf-parse/lib/pdf-parse.js"));
  return pdfParseFn(buffer);
}

/**
 * Extract text from a DOCX file buffer using mammoth.
 */
async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.default.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from an XLSX file buffer using xlsx/sheetjs.
 */
async function parseXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    lines.push(`=== Sheet: ${sheetName} ===`);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    lines.push(csv);
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Extract/describe text from an image using OpenAI Vision API via invokeLLM.
 */
async function parseImage(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a business document OCR and content extraction assistant. Extract ALL text visible in the image. If the image contains a product, menu, price list, brochure, or any business-related content, describe it in detail including any visible text, prices, product names, and other relevant information. Return the extracted content as plain text.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract all text and business information from this image:" },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
  });

  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find(p => typeof p === "object" && "type" in p && p.type === "text");
    if (textPart && "text" in textPart) return textPart.text;
  }
  return "";
}

/**
 * Extract text content from a file based on its MIME type.
 */
async function extractTextFromFile(buffer: Buffer, mimeType: string, originalName: string): Promise<string> {
  switch (mimeType) {
    case "application/pdf": {
      const pdfData = await parsePdf(buffer);
      return pdfData.text;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      return parseDocx(buffer);
    }
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      return parseXlsx(buffer);
    }
    case "text/csv":
    case "text/plain": {
      return buffer.toString("utf-8");
    }
    case "image/jpeg":
    case "image/png":
    case "image/webp":
    case "image/gif": {
      return parseImage(buffer, mimeType);
    }
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/** Determine the KB source label based on MIME type */
function getSourceForMime(mimeType: string): "pdf" | "file" {
  if (mimeType === "application/pdf") return "pdf";
  return "file";
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

  // ─── File Upload Import (PDF, DOCX, XLSX, CSV, Images, TXT) ───────
  app.post("/api/kb/import-file", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "File is required" });
      }

      console.log(`[KB Import] Processing file: ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(1)}KB) for user ${userId}`);

      // Extract text from file
      const extractedText = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);

      if (!extractedText || extractedText.trim().length < 20) {
        return res.json({
          success: true,
          entries: [],
          message: "Could not extract meaningful text from the file. It may be empty or unreadable.",
        });
      }

      // Structure the content using AI
      const result = await structureDocumentContent(extractedText, file.originalname);

      if (result.entries.length === 0) {
        return res.json({
          success: true,
          entries: [],
          message: "No structured content could be extracted from the file.",
        });
      }

      // Save entries to database
      const source = getSourceForMime(file.mimetype);
      const savedEntries = [];
      for (const entry of result.entries) {
        const id = await db.createKnowledgeEntry({
          userId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source,
          sourceUrl: file.originalname,
        });
        if (id) {
          savedEntries.push({ id, ...entry });
        }
      }

      console.log(`[KB Import] Saved ${savedEntries.length} entries from file: ${file.originalname}`);

      return res.json({
        success: true,
        entries: savedEntries,
        message: `Extracted ${savedEntries.length} entries from "${file.originalname}".`,
      });
    } catch (error) {
      console.error("[KB Import] File import error:", error);
      return res.status(500).json({ error: "Failed to process file" });
    }
  });

  // ─── Legacy PDF Upload (backward compatibility) ────────────────────
  app.post("/api/kb/import-pdf", upload.single("pdf"), async (req: Request, res: Response) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      console.log(`[KB Import] Processing PDF (legacy): ${file.originalname} (${(file.size / 1024).toFixed(1)}KB) for user ${userId}`);

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
      const result = await structureDocumentContent(pdfText, file.originalname);

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
