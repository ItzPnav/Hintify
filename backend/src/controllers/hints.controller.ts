import { Request, Response } from "express";
import questionStore from "../services/questionStore.service";
import claude from "../services/ai/claude.service";
import hintLog from "../services/hintLog.service";

export async function requestHint(req: Request, res: Response) {
  const { questionId, level, userId } = req.body as {
    questionId: number;
    level: number;
    userId?: number;
  };

  console.log(`\n→ HINT REQUEST  questionId=${questionId}  level=${level}  userId=${userId ?? "anon"}`);

  if (!questionId || !level) {
    console.warn(`  ✗ Missing fields — questionId or level not provided`);
    return res.status(400).json({ error: "questionId and level required" });
  }

  const q = await questionStore.getById(Number(questionId));
  if (!q) {
    console.warn(`  ✗ Question ${questionId} not found in store`);
    return res.status(404).json({ error: "question not found" });
  }

  const field = level === 1 ? "hint1" : level === 2 ? "hint2" : "solution";

  // @ts-ignore
  if (q[field]?.trim().length > 0) {
    console.log(`  ✓ Cache hit for ${field} on question ${questionId}`);
    return res.json({ text: q[field], fromCache: true });
  }

  console.log(`  ↗ Cache miss — generating ${field} via LLM...`);

  try {
    const generated = await claude.generateHint(q.questionText, Number(level));
    await questionStore.updateById(q.id, { [field]: generated });
    await hintLog.log(q.id, Number(level), generated, userId ? Number(userId) : undefined);
    console.log(`  ✓ Saved ${field} for question ${questionId} to store + DB`);
    return res.json({ text: generated, fromCache: false });
  } catch (err: any) {
    console.error(`  ✗ Failed to generate hint: ${err.message}`);
    return res.status(500).json({ error: "internal server error" });
  }
}