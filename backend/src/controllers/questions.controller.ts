import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import pdfParser from "../services/pdfParser.service";
import questionStore from "../services/questionStore.service";
import { setDocumentContext } from "../services/ai/claude.service";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads");

export async function uploadPdf(req: Request, res: Response) {
  console.log(`\n→ PDF UPLOAD REQUEST`);

  try {
    if (!req.file) {
      console.warn(`  ✗ No file provided in request`);
      return res.status(400).json({ error: "pdf file is required" });
    }

    // Save file to disk so /api/documents/latest can serve it
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const savePath = path.join(UPLOADS_DIR, `latest.pdf`);
    fs.writeFileSync(savePath, req.file.buffer);
    console.log(`  ✓ PDF saved to ${savePath}`);

    const parsed = await pdfParser.parsePdfBuffer(req.file.buffer);
    const added = await questionStore.addMany(parsed);

    console.log(`  ✓ Parsed ${added.length} questions from PDF`);
    return res.json({ added, message: "PDF uploaded and parsed successfully." });
  } catch (err) {
    console.error(`  ✗ Upload failed:`, err);
    return res.status(500).json({ error: "failed to parse pdf" });
  }
}

export async function listQuestions(req: Request, res: Response) {
  try {
    const qs = await questionStore.readAll();
    console.log(`\n→ LIST QUESTIONS  count=${qs.length}`);
    res.json({ questions: qs });
  } catch (err) {
    console.error(`  ✗ Failed to read questions:`, err);
    res.status(500).json({ error: "failed to read questions" });
  }

  const parsed = await pdfParser.parsePdfBuffer(req.file!.buffer);
  const added = await questionStore.addMany(parsed);

  // ← Feed the raw text to the LLM context
  const rawText = await pdfParser.getRawText(req.file!.buffer);
  setDocumentContext(rawText);

  console.log(`  ✓ Parsed ${added.length} questions from PDF`);
  return res.json({ added, message: "PDF uploaded and parsed successfully." });
}