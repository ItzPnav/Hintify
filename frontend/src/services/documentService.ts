// Service to fetch the uploaded PDF from the backend and create a local blob URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const DocumentService = {
  /**
   * Fetches the latest uploaded PDF from the backend.
   * Returns an object URL (blob:...) you can use directly in an <iframe src>.
   * Remember to call URL.revokeObjectURL() when done to free memory.
   */
  async getLatestPdfUrl(): Promise<string> {
    const response = await fetch(`${API_BASE}/api/documents/latest`);

    if (response.status === 404) {
      throw new Error('No document has been uploaded yet.');
    }

    if (!response.ok) {
      throw new Error(`Failed to load document (${response.status}): ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Checks whether a document is available without fetching the full binary.
   */
  async hasDocument(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/documents/latest`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },
};