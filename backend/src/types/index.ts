export type Question = {
  id: number;
  subject?: string;
  questionText: string;
  options?: string[];
  answer?: string;
  hint1?: string;
  hint2?: string;
  solution?: string;
};
