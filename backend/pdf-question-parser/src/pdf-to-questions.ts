import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

/**
 * === TYPES ===
 */
interface Question {
  id: number;
  questionText: string;
  options: string[];
  answer: string;
  hint1: string;
  hint2: string;
  solution: string;
}

interface RawQuestionBlock {
  id: number;
  rawLines: string[];
}

/**
 * Normalize a line from PDF:
 * - Trim spaces
 * - Collapse internal multiple spaces
 */
function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/**
 * Extract raw text from PDF using pdf-parse
 */
async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`[DEBUG] Loaded PDF buffer, size: ${pdfBuffer.length} bytes`);

  const data = await pdf(pdfBuffer);
  console.log(`[DEBUG] PDF metadata -> pages: ${data.numpages}, info:`, {
    numpages: data.numpages,
    numrender: data.numrender
  });

  return data.text;
}

/**
 * Split the PDF text into cleaned lines
 */
function splitIntoLines(text: string): string[] {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines
    .map(normalizeLine)
    .filter((line) => line.length > 0);

  console.log(`[DEBUG] Raw lines: ${rawLines.length}, cleaned non-empty lines: ${lines.length}`);
  return lines;
}

/**
 * Detect question blocks:
 * A "question start" is something like:
 *   "1. What is ...?"
 *   "Q1) What is ...?"
 *   "Q. 1 What is ...?"
 */
function extractRawQuestionBlocks(lines: string[]): RawQuestionBlock[] {
  const questionStartRegex =
    /^\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\]]\s+(.*)$/i;

  const blocks: RawQuestionBlock[] = [];
  let currentBlock: RawQuestionBlock | null = null;

  lines.forEach((line, index) => {
    const match = line.match(questionStartRegex);

    if (match) {
      // New question starts
      const id = parseInt(match[1], 10);
      const firstTextPart = match[2];

      if (currentBlock) {
        blocks.push(currentBlock);
      }

      currentBlock = {
        id,
        rawLines: [firstTextPart]
      };

      console.log(
        `[DEBUG] Detected question start at line ${index}, id=${id}, firstText="${firstTextPart.slice(
          0,
          60
        )}..."`
      );
    } else if (currentBlock) {
      // Continuation of current question block
      currentBlock.rawLines.push(line);
    } else {
      // Lines before first question -> ignore (or use as header)
      console.log(
        `[DEBUG] Ignoring header line ${index}: "${line.slice(0, 60)}..."`
      );
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  console.log(`[DEBUG] Total question blocks detected: ${blocks.length}`);
  return blocks;
}

/**
 * Parse one block into a structured Question
 */
function parseQuestionBlock(block: RawQuestionBlock): Question | null {
  console.log(
    `\n[DEBUG] Parsing question block id=${block.id}, total raw lines=${block.rawLines.length}`
  );

  const optionRegex = /^\s*([A-Da-d])[\.\)\]]\s+(.*)$/; // A) text, B. text
  const answerRegex = /\b(?:Ans(?:wer)?\.?\s*[:\-]\s*)([A-Da-d1-4])/i;

  const questionParts: string[] = [];
  const options: string[] = [];
  const optionMap: Record<string, string> = {};

  let answerText = "";
  let firstOptionIndex = -1;

  block.rawLines.forEach((line, idx) => {
    const optionMatch = line.match(optionRegex);
    const answerMatch = line.match(answerRegex);

    console.log(
      `[DEBUG] Block line ${idx}: "${line}" | isOption=${!!optionMatch} | hasAnswer=${!!answerMatch}`
    );

    if (optionMatch) {
      const letter = optionMatch[1].toUpperCase();
      const text = optionMatch[2].trim();

      if (firstOptionIndex === -1) {
        firstOptionIndex = idx;
      }

      options.push(text);
      optionMap[letter] = text;
      console.log(
        `[DEBUG]   -> Parsed option ${letter}: "${text.slice(0, 60)}..."`
      );
    } else if (answerMatch) {
      const key = answerMatch[1].toUpperCase();
      console.log(`[DEBUG]   -> Found answer marker key="${key}" in line.`);
      answerText = key; // will resolve later to actual option text
    } else {
      // Not option or direct "Answer" line
      questionParts.push(line);
    }
  });

  // Build question text:
  // If we had options, question text = lines before first option
  let questionText = "";
  if (firstOptionIndex !== -1) {
    const qLines = block.rawLines.slice(0, firstOptionIndex);
    questionText = qLines.join(" ");
  } else {
    // No options detected, treat whole block as question
    questionText = block.rawLines.join(" ");
  }
  questionText = normalizeLine(questionText);

  console.log(
    `[DEBUG] Final question text (id=${block.id}): "${questionText.slice(
      0,
      100
    )}..."`
  );

  // Resolve answerText to actual answer
  let answer = "";
  if (answerText) {
    if (/[A-D]/i.test(answerText)) {
      const letter = answerText.toUpperCase();
      if (optionMap[letter]) {
        answer = optionMap[letter];
        console.log(
          `[DEBUG] Answer resolved by letter "${letter}" -> "${answer.slice(
            0,
            60
          )}..."`
        );
      } else {
        console.warn(
          `[WARN] Answer letter "${letter}" found but no matching option text; leaving answer empty.`
        );
      }
    } else if (/[1-4]/.test(answerText)) {
      const index = parseInt(answerText, 10) - 1;
      if (options[index]) {
        answer = options[index];
        console.log(
          `[DEBUG] Answer resolved by index "${answerText}" -> "${answer.slice(
            0,
            60
          )}..."`
        );
      } else {
        console.warn(
          `[WARN] Answer index "${answerText}" does not match any option; leaving answer empty.`
        );
      }
    }
  } else {
    console.warn(
      `[WARN] No explicit answer found for question id=${block.id}; answer will be empty string.`
    );
  }

  if (!questionText) {
    console.warn(
      `[WARN] Empty questionText for id=${block.id}; skipping this block.`
    );
    return null;
  }

  if (options.length === 0) {
    console.warn(
      `[WARN] No options detected for question id=${block.id}; still adding but options[] will be empty.`
    );
  }

  const question: Question = {
    id: block.id,
    questionText,
    options,
    answer,
    hint1: "",
    hint2: "",
    solution: ""
  };

  console.log(
    `[DEBUG] Built Question object: { id: ${question.id}, options: ${question.options.length}, answer: "${question.answer}" }`
  );

  return question;
}

/**
 * Convert all blocks into structured questions
 */
function buildQuestionsFromBlocks(blocks: RawQuestionBlock[]): Question[] {
  const questions: Question[] = [];

  for (const block of blocks) {
    const q = parseQuestionBlock(block);
    if (q) {
      questions.push(q);
    }
  }

  console.log(`[DEBUG] Total valid questions built: ${questions.length}`);
  return questions;
}

/**
 * Write questions.json to disk in the expected format
 */
function writeQuestionsJson(
  questions: Question[],
  outputPath: string
): void {
  const payload = {
    questions
  };

  const json = JSON.stringify(payload, null, 2);
  fs.writeFileSync(outputPath, json, "utf8");

  console.log(
    `[INFO] Wrote ${questions.length} questions to "${outputPath}".`
  );
}

/**
 * === MAIN CLI ENTRY ===
 * Usage:
 *   npm run parse -- path/to/input.pdf
 */
async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error(
      "Usage: ts-node src/pdf-to-questions.ts <path-to-pdf-file>"
    );
    process.exit(1);
  }

  const resolvedPdfPath = path.resolve(pdfPath);
  if (!fs.existsSync(resolvedPdfPath)) {
    console.error(`[ERROR] PDF file not found: ${resolvedPdfPath}`);
    process.exit(1);
  }

  console.log(`[INFO] Parsing PDF: ${resolvedPdfPath}`);

  try {
    const text = await extractTextFromPdf(resolvedPdfPath);
    console.log(
      `[DEBUG] Extracted text length: ${text.length} characters. Sample:`
    );
    console.log("-------- TEXT SAMPLE START --------");
    console.log(text.slice(0, 1000));
    console.log("--------- TEXT SAMPLE END ---------");

    const lines = splitIntoLines(text);
    const blocks = extractRawQuestionBlocks(lines);
    const questions = buildQuestionsFromBlocks(blocks);

    const outputDir = path.dirname(resolvedPdfPath);
    const outputPath = path.join(outputDir, "questions.json");

    writeQuestionsJson(questions, outputPath);
  } catch (err) {
    console.error("[ERROR] Failed to parse PDF:", err);
    process.exit(1);
  }
}

main();
