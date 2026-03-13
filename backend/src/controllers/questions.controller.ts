import { Request, Response } from "express";
import pdfParser from "../services/pdfParser.service";
import questionStore from "../services/questionStore.service";
import pdfStore from "../services/pdfStore.service";

export async function uploadPdf(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "pdf file is required" });
    }

    const buffer: Buffer = req.file.buffer;
    const filename: string = req.file.originalname || "document.pdf";

    // 1. Save the raw PDF binary to Postgres so students can view it
    await pdfStore.save(filename, buffer);

    // 2. Parse questions from the PDF
    const parsed = await pdfParser.parsePdfBuffer(buffer);

    if (parsed.length === 0) {
      console.warn(`uploadPdf: parsed 0 questions from "${filename}"`);
      return res.json({
        added: [],
        message: "PDF saved successfully. No questions could be auto-detected — check numbering format.",
      });
    }

    // 3. Store parsed questions in JSON store
    const added = await questionStore.addMany(parsed);

    return res.json({
      added,
      message: `PDF saved. Parsed and stored ${added.length} question(s).`,
    });
  } catch (err) {
    console.error("uploadPdf error:", err);
    return res.status(500).json({ error: "Failed to process PDF. Please try again." });
  }
}

export async function listQuestions(req: Request, res: Response) {
  try {
    const qs = await questionStore.readAll();
    res.json({ questions: qs });
  } catch (err) {
    console.error("listQuestions error:", err);
    res.status(500).json({ error: "failed to read questions" });
  }
}