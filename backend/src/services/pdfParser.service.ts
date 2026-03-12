import pdfParse from "pdf-parse";

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

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function splitIntoLines(text: string): string[] {
  const rawLines = text.split(/\r?\n/);
  return rawLines
    .map(normalizeLine)
    .filter((line) => line.length > 0);
}

function extractRawQuestionBlocks(lines: string[]): RawQuestionBlock[] {
  const questionStartRegex =
    /^\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\]]\s+(.*)$/i;

  const blocks: RawQuestionBlock[] = [];
  let currentBlock: RawQuestionBlock | null = null;

  lines.forEach((line) => {
    const match = line.match(questionStartRegex);

    if (match) {
      const id = parseInt(match[1], 10);
      const firstTextPart = match[2];

      if (currentBlock) {
        blocks.push(currentBlock);
      }

      currentBlock = {
        id,
        rawLines: [firstTextPart]
      };
    } else if (currentBlock) {
      currentBlock.rawLines.push(line);
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

function parseQuestionBlock(block: RawQuestionBlock): Question | null {
  const optionRegex = /^\s*([A-Da-d])[\.\)\]]\s+(.*)$/;
  const answerRegex = /\b(?:Ans(?:wer)?\.?\s*[:\-]\s*)([A-Da-d1-4])/i;

  const options: string[] = [];
  const optionMap: Record<string, string> = {};

  let answerText = "";
  let firstOptionIndex = -1;

  block.rawLines.forEach((line, idx) => {
    const optionMatch = line.match(optionRegex);
    const answerMatch = line.match(answerRegex);

    if (optionMatch) {
      const letter = optionMatch[1].toUpperCase();
      const text = optionMatch[2].trim();

      if (firstOptionIndex === -1) {
        firstOptionIndex = idx;
      }

      options.push(text);
      optionMap[letter] = text;
    } else if (answerMatch) {
      answerText = answerMatch[1].toUpperCase();
    }
  });

  let questionText = "";
  if (firstOptionIndex !== -1) {
    const qLines = block.rawLines.slice(0, firstOptionIndex);
    questionText = qLines.join(" ");
  } else {
    questionText = block.rawLines.join(" ");
  }
  questionText = normalizeLine(questionText);

  if (!questionText) {
    return null;
  }

  let answer = "";
  if (answerText) {
    if (/[A-D]/i.test(answerText)) {
      const letter = answerText.toUpperCase();
      if (optionMap[letter]) {
        answer = optionMap[letter];
      }
    } else if (/[1-4]/.test(answerText)) {
      const index = parseInt(answerText, 10) - 1;
      if (options[index]) {
        answer = options[index];
      }
    }
  }

  return {
    id: block.id,
    questionText,
    options,
    answer,
    hint1: "",
    hint2: "",
    solution: ""
  };
}

/**
 * Parse PDF buffer and extract questions
 */
export default {
  async parsePdfBuffer(buffer: Buffer): Promise<Question[]> {
    const data = await pdfParse(buffer);
    const text = data.text || "";

    const lines = splitIntoLines(text);
    const blocks = extractRawQuestionBlocks(lines);

    const questions: Question[] = [];
    for (const block of blocks) {
      const q = parseQuestionBlock(block);
      if (q) {
        questions.push(q);
      }
    }

    return questions;
  }
};
