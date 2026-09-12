export type QuestionType = "multiplication" | "addition" | "subtraction" | "division" | "mixed";

export interface AnswerAttempt {
  id: string;
  questionType: QuestionType;
  operands: [number, number];
  correctAnswer: number;
  selectedAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  timestamp: string;
}

export type MasteryLevel = "new" | "learning" | "steady" | "mastered";

export interface FactStats {
  key: string;
  questionType: QuestionType;
  operands: [number, number];
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  averageResponseTimeMs: number;
  lastPracticedDate: string;
  masteryLevel: MasteryLevel;
}

export interface PracticeQuestion {
  questionType: QuestionType;
  operands: [number, number];
  prompt: string;
  correctAnswer: number;
  choices: number[];
}

export interface DailySummary {
  date: string;
  attempts: number;
  correct: number;
  accuracy: number;
  averageResponseTimeMs: number;
}
