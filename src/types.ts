export interface Option {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ClientQuestion {
  id: number;
  question: string;
  options: Option[];
}

export interface QuizData {
  quizId: string;
  token: string;
  title: string;
  submissionFormatPrompt: string;
  questions: ClientQuestion[];
}

export interface QuestionFeedback {
  id: number;
  question: string;
  options: Option[];
  studentAnswer: 'A' | 'B' | 'C' | 'D';
  studentAnswerText: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswerText: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  feedback: QuestionFeedback[];
  overallFeedback: string;
}

export interface SampleNote {
  topic: string;
  preview: string;
  content: string;
}
