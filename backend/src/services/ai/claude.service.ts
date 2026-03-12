import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

if (!API_KEY) {
  console.warn("ANTHROPIC_API_KEY not set. Claude requests will fail.");
}

/**
 * Simple wrapper to request a completion from Anthropic/Claude
 */
export default {
  async generateHint(questionText: string, level: number) {
    if (!API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

    const prompt =
      level === 1
        ? `Give a short beginner-level hint (do NOT reveal the answer). Question:\n${questionText}\nHint:`
        : level === 2
        ? `Give a stronger hint (still do NOT reveal the final answer). Question:\n${questionText}\nHint:`
        : `Provide the final answer and a clear explanation/solution. Question:\n${questionText}\nSolution:`;

    const url = "https://api.anthropic.com/v1/messages";
    const payload = {
      model: MODEL,
      max_tokens: level === 3 ? 800 : 200,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        }
      });

      // Extract text from Claude's response
      const text = res.data?.content?.[0]?.text || "";
      return String(text).trim();
    } catch (err: any) {
      console.error("Claude API error:", err.response?.data || err.message);
      throw err;
    }
  }
};
