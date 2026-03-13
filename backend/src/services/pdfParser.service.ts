import pdfParse from "pdf-parse";

export default {
  async getRawText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text || "";
  },

  async parsePdfBuffer(buffer: Buffer) {
    const data = await pdfParse(buffer);
    const raw = data.text || "";

    // Normalise whitespace
    const text = raw
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00ad|\u200b/g, "")
      .replace(/[ \t]{2,}/g, " ");

    const lines = text.split("\n");
    const blocks: string[] = [];
    let current: string[] = [];

    // Matches: Q.1  Q.2  Q.10  Q.1.  Q1  (at start of line)
    const Q_START = /^[ \t]*Q\.?\s*(\d{1,3})\b/i;

    for (const line of lines) {
      if (Q_START.test(line) && current.length > 0) {
        blocks.push(current.join("\n"));
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) blocks.push(current.join("\n"));

    const parsed: any[] = [];

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      // Extract question number and body
      const headerMatch = trimmed.match(/^[ \t]*Q\.?\s*(\d{1,3})\b[.):\s]?\s*([\s\S]+)/i);
      if (!headerMatch) continue;

      const qnum = Number(headerMatch[1]);
      const body = headerMatch[2].trim();

      // Split off options: (A) (B) (C) (D)  or  A)  A.
      const bodyLines = body.split("\n");
      const questionLines: string[] = [];
      const optionLines: string[] = [];
      let inOptions = false;

      for (const l of bodyLines) {
        if (!inOptions && /^[ \t]*(?:\([A-Da-d]\)|[A-Da-d][).:])\s+/.test(l)) {
          inOptions = true;
        }
        if (inOptions) {
          optionLines.push(l);
        } else {
          questionLines.push(l);
        }
      }

      const questionText = questionLines
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim();

      const options = optionLines
        .map((o) => o.replace(/^[ \t]*(?:\([A-Da-d]\)|[A-Da-d][).:])[ \t]*/i, "").trim())
        .filter(Boolean);

      if (!questionText) continue;

      parsed.push({ id: qnum, questionText, options });
    }

    // De-duplicate and sort
    const seen = new Set<number>();
    const deduped = parsed.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });

    deduped.sort((a, b) => a.id - b.id);

    console.log(`Parsed questions: ${deduped.length} questions`);
    return deduped;
  },
};