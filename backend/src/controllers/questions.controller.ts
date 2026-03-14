import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
import pdfParser from "../services/pdfParser.service";
import questionStore from "../services/questionStore.service";
import { setDocumentContext } from "../services/ai/claude.service";
import db from "../config/db";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads");

/**
 * POST /api/questions/upload
 * Clears all previous questions + hints_log, then parses and stores the new PDF.
 */
export async function uploadPdf(req: Request, res: Response) {
  console.log(`\n→ PDF UPLOAD REQUEST`);

  try {
    if (!req.file) {
      console.warn(`  ✗ No file provided in request`);
      return res.status(400).json({ error: "pdf file is required" });
    }

    // ── 1. Save file to disk so /api/documents/latest can serve it ──────────
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const savePath = path.join(UPLOADS_DIR, `latest.pdf`);
    fs.writeFileSync(savePath, req.file.buffer);
    console.log(`  ✓ PDF saved to ${savePath}`);

    // ── 2. Wipe previous questions from JSON store ───────────────────────────
    await questionStore.writeAll([]);
    console.log(`  ✓ Previous questions cleared`);

    // ── 3. Wipe hints_log in Postgres so analytics start fresh ──────────────
    try {
      await db.query("DELETE FROM hints_log");
      console.log(`  ✓ hints_log cleared`);
    } catch (dbErr) {
      // Non-fatal: DB may not be running in local dev
      console.warn(`  ⚠ Could not clear hints_log (DB may be unavailable):`, dbErr);
    }

    // ── 4. Parse new PDF ─────────────────────────────────────────────────────
    const parsed = await pdfParser.parsePdfBuffer(req.file.buffer);
    const added = await questionStore.addMany(parsed);
    console.log(`  ✓ Parsed ${added.length} questions from PDF`);

    // ── 5. Feed raw text to LLM context ─────────────────────────────────────
    const rawText = await pdfParser.getRawText(req.file.buffer);
    setDocumentContext(rawText);
    console.log(`  ✓ Document context set for Claude`);

    return res.json({
      added,
      questionCount: added.length,
      message: `Cleared previous data. Parsed and stored ${added.length} question(s).`,
    });
  } catch (err) {
    console.error(`  ✗ Upload failed:`, err);
    return res.status(500).json({ error: "failed to parse pdf" });
  }
}

/**
 * GET /api/questions
 * Returns all stored questions.
 */
export async function listQuestions(req: Request, res: Response) {
  try {
    const qs = await questionStore.readAll();
    console.log(`\n→ LIST QUESTIONS  count=${qs.length}`);
    res.json({ questions: qs });
  } catch (err) {
    console.error(`  ✗ Failed to read questions:`, err);
    res.status(500).json({ error: "failed to read questions" });
  }
}

/**
 * GET /api/questions/count
 * Lightweight endpoint — returns only the number of parsed questions.
 * Used by the frontend to sync column count after page refresh.
 */
export async function getQuestionCount(req: Request, res: Response) {
  try {
    const qs = await questionStore.readAll();
    res.json({ count: qs.length });
  } catch (err) {
    console.error(`  ✗ Failed to read question count:`, err);
    res.status(500).json({ error: "failed to read question count" });
  }
}