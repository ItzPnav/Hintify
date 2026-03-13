import { Request, Response } from "express";
import pdfStore from "../services/pdfStore.service";

/**
 * GET /api/documents/latest
 * Returns the latest uploaded PDF as a binary stream.
 * The frontend creates a blob URL from this to render in an <iframe>.
 */
export async function getLatestDocument(req: Request, res: Response) {
  try {
    const doc = await pdfStore.getLatest();

    if (!doc) {
      return res.status(404).json({ error: "No document uploaded yet." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${doc.filename}"`);
    res.setHeader("Content-Length", doc.data.length);
    // Allow the frontend (same machine, different port) to read the response
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.send(doc.data);
  } catch (err) {
    console.error("getLatestDocument error:", err);
    return res.status(500).json({ error: "Failed to retrieve document." });
  }
}