export interface HintRequest {
  id: string;
  studentId: string;
  studentName: string;
  questionNumber: number;
  question: string;
  firstHintAsked: boolean;
  secondHintAsked: boolean;
  solutionGiven: boolean;
  timestamp: Date;
}

export interface StudentHintStats {
  studentId: string;
  studentName: string;
  questionHints: { [questionNumber: number]: { firstHint: boolean; secondHint: boolean; solutionGiven: boolean } };
  totalHints: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'hint1' | 'hint2' | 'solution';
}