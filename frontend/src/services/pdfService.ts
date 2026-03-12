// PDF service that integrates with backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const PDFService = {
  async extractTextFromFile(file: File) {
    // Upload PDF to backend and get parsed questions
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch(`${API_BASE}/api/questions/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert parsed questions to readable text format
      const questionsText = data.added
        .map((q: any) => {
          let text = `Question ${q.id}: ${q.questionText}\n`;
          if (q.options && q.options.length > 0) {
            text += q.options.map((opt: string, i: number) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
          }
          return text;
        })
        .join('\n\n');

      return questionsText || 'PDF processed but no questions found.';
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw error;
    }
  },

  async load(file: File | string) {
    if (typeof file === 'string') {
      return { pages: 1, text: 'Placeholder PDF content' };
    }
    const text = await this.extractTextFromFile(file);
    return { pages: 1, text };
  },

  async getText(pageNumber: number) {
    return `Text for page ${pageNumber} (placeholder).`;
  },

  async download() {
    return true;
  },
};

export type PDFServiceType = typeof PDFService;
