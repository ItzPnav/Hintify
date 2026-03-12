import { Request, Response } from "express";
import questionStore from "../services/questionStore.service";
import claude from "../services/ai/claude.service";
import hintLog from "../services/hintLog.service";

export async function requestHint(req: Request, res: Response) {
  try {
    const { questionId, level, userId } = req.body;
    if (!questionId || !level) return res.status(400).json({ error: "questionId and level required" });

    const q = await questionStore.getById(Number(questionId));
    if (!q) return res.status(404).json({ error: "question not found" });

    // Choose the field
    const field = level === 1 ? "hint1" : level === 2 ? "hint2" : "solution";
    
    // If already exists, return it
    // @ts-ignore
    if (q[field] && q[field].trim().length > 0) {
      return res.json({ text: q[field], fromCache: true });
    }

    // Generate via Claude
    const generated = await claude.generateHint(q.questionText, Number(level));

    // Save to JSON
    await questionStore.updateById(q.id, { [field]: generated });

    // Log to Postgres
    await hintLog.log(q.id, Number(level), generated, userId ? Number(userId) : undefined);

    return res.json({ text: generated, fromCache: false });
  } catch (err) {
    console.error("requestHint error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
