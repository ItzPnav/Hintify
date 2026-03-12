import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { Question } from "../types";

const QUESTIONS_FILE = process.env.QUESTIONS_FILE || path.join(__dirname, "..", "..", "data", "questions.json");

export default {
  async readAll(): Promise<Question[]> {
    try {
      const raw = await fs.readFile(QUESTIONS_FILE, "utf8");
      const data = JSON.parse(raw);
      return data.questions || [];
    } catch (err: any) {
      if (err.code === "ENOENT") {
        await fs.mkdir(path.dirname(QUESTIONS_FILE), { recursive: true });
        await fs.writeFile(QUESTIONS_FILE, JSON.stringify({ questions: [] }, null, 2), "utf8");
        return [];
      }
      throw err;
    }
  },

  async writeAll(questions: Question[]) {
    const payload = { questions };
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(payload, null, 2), "utf8");
  },

  async getById(id: number) {
    const qs = await this.readAll();
    return qs.find((q) => q.id === id);
  },

  async updateById(id: number, patch: Partial<Question>) {
    const qs = await this.readAll();
    const idx = qs.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    qs[idx] = { ...qs[idx], ...patch };
    await this.writeAll(qs);
    return qs[idx];
  },

  async addMany(questions: Question[]) {
    const qs = await this.readAll();
    const maxId = qs.reduce((m, q) => Math.max(m, q.id || 0), 0);
    let nextId = maxId + 1;
    const added = questions.map((q) => {
      const { id, ...rest } = q;
      return { id: id || nextId++, ...rest };
    });
    const merged = [...qs, ...added];
    await this.writeAll(merged);
    return added;
  }
};
