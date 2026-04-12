import { readFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { generateId, slugify, buildFrontmatter, nowISO } from "./utils";
import type { IngestResult } from "./index";

// Dependency injection for pdf-parse loader (set by the app's native-loader)
interface PdfParseStatic {
  PDFParse: new (buf: Buffer) => {
    getText: () => Promise<{ text: string; total: number }>;
  };
}

let pdfParseLoader: (() => PdfParseStatic) | null = null;
export function registerPdfParseLoader(fn: () => PdfParseStatic): void {
  pdfParseLoader = fn;
}

export async function ingestPdf(
  sourcePath: string,
  rawPath: string,
): Promise<IngestResult> {
  if (!pdfParseLoader) {
    throw new Error(
      "pdf-parse loader not registered — call registerPdfParseLoader() at app startup",
    );
  }
  const { PDFParse } = pdfParseLoader();
  const buffer = await readFile(sourcePath);
  const parser = new PDFParse(buffer);
  const result = await parser.getText();

  const title = basename(sourcePath, ".pdf");
  const id = generateId();
  const slug = slugify(title);
  const fileName = `${slug}-${id}.md`;
  const filePath = join(rawPath, fileName);

  const frontmatter = buildFrontmatter({
    id,
    title,
    sourceType: "pdf",
    sourcePath: sourcePath,
    ingestedAt: nowISO(),
    pages: String(result.total),
    tags: [],
    checksum: "",
  });

  // Clean up extracted text
  const cleanText = result.text
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const fullContent = `${frontmatter}\n\n# ${title}\n\n${cleanText}\n`;
  await writeFile(filePath, fullContent, "utf-8");

  return {
    filePath: fileName,
    title,
    sourceType: "pdf",
  };
}
