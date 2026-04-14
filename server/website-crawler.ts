import * as cheerio from "cheerio";
import { invokeLLM } from "./_core/llm";

const MAX_PAGES = 10;
const FETCH_TIMEOUT = 15000;

/**
 * Crawl a website and extract structured business information.
 */
export async function crawlWebsite(url: string): Promise<{
  entries: Array<{ title: string; content: string; category: "product" | "pricing" | "faq" | "policy" | "general" }>;
  pagesScraped: number;
  sourceUrl: string;
}> {
  // Normalize URL
  if (!url.startsWith("http")) url = "https://" + url;
  const baseUrl = new URL(url);
  const origin = baseUrl.origin;

  // Discover pages to crawl
  const pagesToCrawl = new Set<string>([url]);
  const crawled = new Set<string>();
  const allContent: Array<{ url: string; title: string; text: string }> = [];

  // Priority pages to look for
  const priorityPaths = ["/about", "/products", "/services", "/pricing", "/faq", "/contact", "/menu", "/catalog"];

  // Add priority paths
  for (const path of priorityPaths) {
    pagesToCrawl.add(origin + path);
    pagesToCrawl.add(origin + path + "/");
  }

  // Crawl pages
  for (const pageUrl of Array.from(pagesToCrawl)) {
    if (crawled.size >= MAX_PAGES) break;
    if (crawled.has(pageUrl)) continue;
    crawled.add(pageUrl);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(pageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RocketeerBot/1.0; +https://rocketeerio.vercel.app)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // Extract title
      const title = $("title").text().trim() || $("h1").first().text().trim() || pageUrl;

      // Remove script, style, nav, footer, header noise
      $("script, style, nav, footer, header, iframe, noscript, .cookie-banner, .popup").remove();

      // Extract main content
      const mainContent = $("main, article, .content, .main-content, #content, #main").text().trim();
      const bodyContent = $("body").text().trim();
      const text = (mainContent || bodyContent)
        .replace(/\s+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .substring(0, 8000); // Limit per page

      if (text.length > 50) {
        allContent.push({ url: pageUrl, title, text });
      }

      // Discover linked pages on the same domain
      if (crawled.size < MAX_PAGES) {
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          try {
            const resolved = new URL(href, pageUrl);
            if (resolved.origin === origin && !resolved.hash && !resolved.pathname.match(/\.(pdf|jpg|png|gif|svg|css|js|zip)$/i)) {
              pagesToCrawl.add(resolved.origin + resolved.pathname);
            }
          } catch {}
        });
      }
    } catch (err) {
      // Skip failed pages
      console.warn(`[Crawler] Failed to fetch ${pageUrl}:`, err);
    }
  }

  if (allContent.length === 0) {
    return { entries: [], pagesScraped: 0, sourceUrl: url };
  }

  // Use GPT to structure the extracted content
  const combinedText = allContent
    .map(p => `=== PAGE: ${p.title} (${p.url}) ===\n${p.text}`)
    .join("\n\n---\n\n")
    .substring(0, 30000); // Limit total context

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a business information extractor. Analyze the website content and extract structured knowledge base entries. Create entries for each distinct topic found.

Categories:
- "product": Products, services, offerings, features
- "pricing": Prices, packages, plans, costs
- "faq": Common questions, how-to information
- "policy": Terms, warranties, return policies, shipping
- "general": Company info, about us, mission, contact details

For each entry, write a clear, detailed description that an AI sales agent could use to answer customer questions. Include specific details like prices, features, timelines, etc.

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Extract business knowledge from this website content:\n\n${combinedText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_entries",
        strict: true,
        schema: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clear, descriptive title" },
                  content: { type: "string", description: "Detailed content for the AI to reference" },
                  category: { type: "string", enum: ["product", "pricing", "faq", "policy", "general"], description: "Category" },
                },
                required: ["title", "content", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = result.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text);
    const entries = (parsed.entries || []).map((e: any) => ({
      title: String(e.title || "").substring(0, 255),
      content: String(e.content || ""),
      category: ["product", "pricing", "faq", "policy", "general"].includes(e.category) ? e.category : "general",
    }));

    return { entries, pagesScraped: allContent.length, sourceUrl: url };
  } catch {
    return { entries: [], pagesScraped: allContent.length, sourceUrl: url };
  }
}

/**
 * Extract and structure content from PDF text.
 */
export async function structurePdfContent(pdfText: string, fileName: string): Promise<{
  entries: Array<{ title: string; content: string; category: "product" | "pricing" | "faq" | "policy" | "general" }>;
}> {
  if (!pdfText || pdfText.trim().length < 20) {
    return { entries: [] };
  }

  const truncatedText = pdfText.substring(0, 30000);

  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a business information extractor. Analyze the PDF document content and extract structured knowledge base entries. The PDF may be a product catalog, brochure, price list, or specification sheet.

Categories:
- "product": Products, services, offerings, features, specifications
- "pricing": Prices, packages, plans, costs
- "faq": Common questions, how-to information
- "policy": Terms, warranties, return policies, shipping
- "general": Company info, about us, mission, contact details

For each entry, write a clear, detailed description that an AI sales agent could use to answer customer questions. Include specific details like prices, features, dimensions, materials, etc.

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Extract business knowledge from this PDF document "${fileName}":\n\n${truncatedText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_entries",
        strict: true,
        schema: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clear, descriptive title" },
                  content: { type: "string", description: "Detailed content for the AI to reference" },
                  category: { type: "string", enum: ["product", "pricing", "faq", "policy", "general"], description: "Category" },
                },
                required: ["title", "content", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = result.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text);
    const entries = (parsed.entries || []).map((e: any) => ({
      title: String(e.title || "").substring(0, 255),
      content: String(e.content || ""),
      category: ["product", "pricing", "faq", "policy", "general"].includes(e.category) ? e.category : "general",
    }));

    return { entries };
  } catch {
    return { entries: [] };
  }
}
