// AI service that integrates with backend Claude API
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
let documentText = '';

export const AIService = {
  setDocumentText(text: string) {
    documentText = text;
  },

  isRequestingHelp(message: string) {
    const m = message?.toLowerCase() ?? '';
    return m.includes('help') || /question\s*\d+/i.test(m) || m.includes("i don't understand");
  },

  isRequestingMoreHelp(message: string) {
    const m = message?.toLowerCase() ?? '';
    return m.includes('more') || m.includes('again') || m.includes('still');
  },

  extractQuestionNumber(message: string): number | null {
    if (!message) return null;
    const match = message.match(/question\s*(\d+)/i);
    if (match && match[1]) return Number(match[1]);
    const digits = message.match(/\b(\d+)\b/);
    if (digits) return Number(digits[1]);
    return null;
  },

  async generateResponse(message: string, hintLevel: 'first' | 'second' | 'solution' = 'first') {
    const qnum = this.extractQuestionNumber(message);
    
    if (!qnum) {
      return 'Please specify a question number (e.g., "Question 5" or just "5").';
    }

    // Map hint level to number (1 = first, 2 = second, 3 = solution)
    const levelMap = {
      'first': 1,
      'second': 2,
      'solution': 3
    };

    try {
      const response = await fetch(`${API_BASE}/api/hints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: qnum,
          level: levelMap[hintLevel],
          userId: 1, // Can be updated with actual user ID from context
        }),
      });

      if (!response.ok) {
        throw new Error(`Hint request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || 'Unable to generate hint at this time.';
    } catch (error) {
      console.error('AI hint error:', error);
      return 'Error generating hint. Please try again.';
    }
  },
};

export type AIServiceType = typeof AIService;
