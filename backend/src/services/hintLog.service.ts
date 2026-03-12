import db from "../config/db";

export default {
  async log(questionId: number, hintLevel: number, generatedText: string, userId?: number) {
    try {
      await db.query(
        "INSERT INTO hints_log(question_id, hint_level, user_id, generated_text) VALUES($1,$2,$3,$4)",
        [questionId, hintLevel, userId || null, generatedText]
      );
    } catch (err) {
      console.error("Failed to log hint:", err);
    }
  }
};
