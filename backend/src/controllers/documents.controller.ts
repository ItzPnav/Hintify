import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, "..", "..", "uploads")
); // ← path.resolve() makes it absolute

export function getLatestDocument(req: Request, res: Response) {
  console.log(`\n→ DOCUMENT REQUEST  method=${req.method}`);
  console.log(`  Looking in: ${UPLOADS_DIR}`);

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.warn(`  ✗ Uploads dir does not exist: ${UPLOADS_DIR}`);
    return res.status(404).json({ error: "No document uploaded yet." });
  }

  const files = fs.readdirSync(UPLOADS_DIR)
    .filter(f => f.endsWith(".pdf"))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(UPLOADS_DIR, f)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.warn(`  ✗ No PDFs found in ${UPLOADS_DIR}`);
    return res.status(404).json({ error: "No document uploaded yet." });
  }

  const filePath = path.join(UPLOADS_DIR, files[0].name); // already absolute
  console.log(`  ✓ Serving: ${filePath}`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${files[0].name}"`);
  res.setHeader("Access-Control-Allow-Origin", "*"); // ← allow frontend to load it

  return res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`  ✗ sendFile error:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to send file." });
      }
    }
  });
}