import { Request, Response } from "express";
import pdfParser from "../services/pdfParser.service";
import questionStore from "../services/questionStore.service";

export async function uploadPdf(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "pdf file is required" });
    const buffer: Buffer = req.file.buffer;
    
    console.log("Received PDF file:", req.file.originalname, "Size:", buffer.length, "bytes");
    
    const parsed = await pdfParser.parsePdfBuffer(buffer);
    console.log("Parsed questions:", parsed.length, "questions");
    
    if (parsed.length === 0) {
      return res.status(400).json({ 
        error: "No questions found in PDF. Check the format.",
        details: "Make sure questions are numbered (1., 2., etc.) with options (A), B), etc.)"
      });
    }
    
    const added = await questionStore.addMany(parsed);
    console.log("Added to store:", added.length, "questions");
    
    return res.json({ 
      added, 
      message: `Successfully parsed and added ${added.length} questions` 
    });
  } catch (err) {
    console.error("PDF upload error:", err);
    return res.status(500).json({ 
      error: "failed to parse pdf", 
      details: String(err) 
    });
  }
}

export async function listQuestions(req: Request, res: Response) {
  try {
    const qs = await questionStore.readAll();
    res.json({ questions: qs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to read questions" });
  }
}
