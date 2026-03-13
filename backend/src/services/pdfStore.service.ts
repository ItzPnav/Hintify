import db from "../config/db";

export default {
  /**
   * Save a PDF buffer to Postgres. Replaces any previously stored PDF
   * (we only ever need the latest one active for students).
   */
  async save(filename: string, buffer: Buffer): Promise<number> {
    // Delete old documents so only the latest is ever active
    await db.query("DELETE FROM pdf_documents");

    const result = await db.query(
      "INSERT INTO pdf_documents (filename, mime_type, data) VALUES ($1, $2, $3) RETURNING id",
      [filename, "application/pdf", buffer]
    );
    return result.rows[0].id as number;
  },

  /**
   * Retrieve the latest PDF document.
   * Returns null if no PDF has been uploaded yet.
   */
  async getLatest(): Promise<{ id: number; filename: string; data: Buffer } | null> {
    const result = await db.query(
      "SELECT id, filename, data FROM pdf_documents ORDER BY uploaded_at DESC LIMIT 1"
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as number,
      filename: row.filename as string,
      data: row.data as Buffer,
    };
  },
};