import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Initialize Google GenAI on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SECRET_KEY = process.env.SESSION_SECRET || 'practice-quiz-university-key-2026';

function encryptPayload(data: unknown): string {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptPayload<T>(token: string): T | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, encryptedHex] = parts;
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted) as T;
  } catch (err) {
    console.error('Failed to decrypt token:', err);
    return null;
  }
}

interface StoredQuestion {
  id: number;
  question: string;
  options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

interface QuizStorage {
  quizId: string;
  title: string;
  notes: string;
  questions: StoredQuestion[];
  createdAt: number;
}

// In-memory cache for recent quizzes (backed by encrypted token fallback)
const quizStore = new Map<string, QuizStorage>();

// Prune quizzes older than 3 hours
setInterval(() => {
  const cutoff = Date.now() - 3 * 60 * 60 * 1000;
  for (const [id, quiz] of quizStore.entries()) {
    if (quiz.createdAt < cutoff) {
      quizStore.delete(id);
    }
  }
}, 30 * 60 * 1000);

// Sample preset study notes for students to test right away
const SAMPLE_NOTES = [
  {
    topic: 'Biology: Cellular Respiration',
    preview: 'Glycolysis, Krebs Cycle, and Oxidative Phosphorylation mechanisms...',
    content: `Cellular respiration is the metabolic process cells use to convert biochemical energy from nutrients into ATP. It consists of three primary stages:

1. Glycolysis: Occurs in the cytoplasm (cytosol). It breaks down one glucose molecule (6 carbons) into two pyruvate molecules (3 carbons each), producing a net yield of 2 ATP and 2 NADH. Glycolysis does not require oxygen (anaerobic).

2. Krebs Cycle (Citric Acid Cycle): Occurs inside the mitochondrial matrix. Before entering, pyruvate is converted into Acetyl-CoA via pyruvate oxidation, generating CO2 and NADH. The Krebs cycle yields 2 ATP, 6 NADH, 2 FADH2, and releases 4 CO2 molecules per glucose.

3. Oxidative Phosphorylation: Occurs along the mitochondrial inner membrane (cristae). High-energy electrons from NADH and FADH2 are transferred through the Electron Transport Chain (ETC). Oxygen serves as the final electron acceptor, combining with protons to form water (H2O). The proton electrochemical gradient powers ATP synthase via chemiosmosis, generating approximately 26 to 28 ATP.`
  },
  {
    topic: 'Computer Science: Algorithmic Complexity',
    preview: 'Big-O notation, binary search, and comparison sorting algorithms...',
    content: `Big-O notation describes the upper bound of an algorithm's runtime or space complexity as input size n grows.

1. Binary Search: Operates on sorted arrays by repeatedly dividing the search interval in half. Its time complexity is O(log n) in average and worst cases, with O(1) auxiliary space complexity. It cannot be used directly on unsorted arrays.

2. Comparison Sorts:
- Quicksort uses a divide-and-conquer strategy with a pivot. Its average time complexity is O(n log n), but its worst-case complexity degrades to O(n^2) when poor pivots are chosen (e.g., already sorted array with first element as pivot).
- Merge Sort also uses divide-and-conquer, always guaranteeing O(n log n) worst-case time complexity, but requires O(n) auxiliary memory space to merge subarrays.
- Bubble Sort and Insertion Sort have worst-case time complexity of O(n^2). Insertion sort runs in O(n) when the input is already nearly sorted.`
  },
  {
    topic: 'Psychology: Memory & Working Memory Model',
    preview: 'Baddeley & Hitch model, phonological loop, and memory consolidation...',
    content: `Alan Baddeley and Graham Hitch proposed the Working Memory Model in 1974 to replace Atkinson-Shiffrin's unitary short-term memory store.

Key Components of Working Memory:
1. Central Executive: The attentional control system with limited capacity. It allocates cognitive resources, coordinates the slave systems, and directs focus. It does not store information itself.

2. Phonological Loop: Handles verbal and acoustic information. It is divided into:
- Phonological Store ("inner ear"): Holds speech-based information for 1.5–2 seconds.
- Articulatory Rehearsal Component ("inner voice"): Repeats words to prevent decay through subvocal rehearsal.

3. Visuospatial Sketchpad ("inner eye"): Stores and manipulates visual and spatial information (e.g., navigating a mental map).

4. Episodic Buffer (added in 2000): A temporary multi-modal storage system that integrates visual, spatial, and verbal information with chronological sequencing and links working memory to long-term memory.`
  }
];

app.get('/api/sample-notes', (_req, res) => {
  res.json({ samples: SAMPLE_NOTES });
});

/**
 * Generate 3 multiple choice questions from study notes
 */
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      res.status(400).json({
        error: 'EMPTY_NOTES',
        message: 'Please provide study notes before generating a quiz. Enter lecture notes, textbook excerpts, or topic summaries.',
      });
      return;
    }

    const trimmedNotes = notes.trim();
    if (trimmedNotes.length < 20) {
      res.status(400).json({
        error: 'INSUFFICIENT_NOTES',
        message: 'Your study material is very brief. Please provide a little more detail so that 3 distinct multiple-choice questions can be generated.',
      });
      return;
    }

    const systemInstruction = `You are a practice quiz assistant for university students.

Source Constraints:
Base questions, correct answers, and explanations strictly on the study material supplied by the user. If no material is supplied, ask for it before generating a quiz.
Do not hallucinate facts outside the provided notes.

Quiz Generation and Presentation:
1. Generate exactly three multiple-choice questions using the provided study material.
2. Number each question (1, 2, 3) and include four options labelled A, B, C, and D.
3. Make sure each question has only one correct answer.
4. Provide a clear, factual explanation for the correct answer derived directly from the provided study notes.
5. Provide a succinct topic title summarizing the subject of the notes.`;

    const prompt = `Study Material supplied by student:
"""
${trimmedNotes}
"""

Generate exactly 3 multiple-choice questions with 4 options (A, B, C, D) based strictly on the above study material.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Succinct title or topic name summarizing the study notes (e.g. "Cellular Respiration Stages")',
        },
        questions: {
          type: Type.ARRAY,
          description: 'Exactly 3 multiple-choice questions',
          items: {
            type: Type.OBJECT,
            properties: {
              id: {
                type: Type.INTEGER,
                description: 'Question index: 1, 2, or 3',
              },
              question: {
                type: Type.STRING,
                description: 'The question text',
              },
              options: {
                type: Type.ARRAY,
                description: 'Four choices labelled A, B, C, and D',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: {
                      type: Type.STRING,
                      description: 'Choice letter: A, B, C, or D',
                    },
                    text: {
                      type: Type.STRING,
                      description: 'The answer option text',
                    },
                  },
                  required: ['label', 'text'],
                },
              },
              correctOption: {
                type: Type.STRING,
                description: 'The single correct option letter: A, B, C, or D',
              },
              explanation: {
                type: Type.STRING,
                description: 'Concise explanation verifying the correct choice using the provided study notes',
              },
            },
            required: ['id', 'question', 'options', 'correctOption', 'explanation'],
          },
        },
      },
      required: ['title', 'questions'],
    };

    let rawText: string | undefined;
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;

    for (const model of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema,
            },
          });
          if (response.text) {
            rawText = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} attempt ${attempt + 1} error:`, err?.message || err);
          await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
        }
      }
      if (rawText) break;
    }

    if (!rawText) {
      throw lastError || new Error('No response text returned from Gemini API.');
    }

    const parsed = JSON.parse(rawText);
    const questions: StoredQuestion[] = (parsed.questions || []).map((q: any, idx: number) => ({
      id: idx + 1,
      question: q.question,
      options: (q.options || []).map((opt: any) => ({
        label: opt.label.toUpperCase() as 'A' | 'B' | 'C' | 'D',
        text: opt.text,
      })),
      correctOption: q.correctOption.toUpperCase() as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation,
    }));

    if (questions.length < 3) {
      throw new Error('Less than 3 questions were generated. Please try again.');
    }

    const quizId = crypto.randomUUID();
    const quizRecord: QuizStorage = {
      quizId,
      title: parsed.title || 'Study Material Practice Quiz',
      notes: trimmedNotes,
      questions: questions.slice(0, 3),
      createdAt: Date.now(),
    };

    quizStore.set(quizId, quizRecord);

    // Encrypt the answers and explanations so client-side state cannot inspect answers,
    // but session survives even if server process restarts
    const encryptedToken = encryptPayload({
      quizId,
      questions: quizRecord.questions,
    });

    // Send questions to client WITHOUT answers or explanations
    const clientQuestions = quizRecord.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options.map((o) => ({ label: o.label, text: o.text })),
    }));

    res.json({
      quizId,
      token: encryptedToken,
      title: quizRecord.title,
      submissionFormatPrompt: 'Submit your answers using the question number and option letter, such as 1B, 2D, 3A.',
      questions: clientQuestions,
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: error?.message || 'Failed to generate quiz. Please check your notes and try again.',
    });
  }
});

/**
 * Grade student answers and provide score and explanations
 */
app.post('/api/submit-quiz', async (req, res) => {
  try {
    const { quizId, token, answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({
        error: 'NO_ANSWERS',
        message: 'No answers submitted. Please select an answer (A, B, C, or D) for each question.',
      });
      return;
    }

    // Retrieve quiz from memory or fallback decrypt
    let quiz = quizStore.get(quizId);
    let questions: StoredQuestion[] | undefined = quiz?.questions;

    if (!questions && token) {
      const decrypted = decryptPayload<{ quizId: string; questions: StoredQuestion[] }>(token);
      if (decrypted && decrypted.questions) {
        questions = decrypted.questions;
      }
    }

    if (!questions || questions.length < 3) {
      res.status(404).json({
        error: 'QUIZ_NOT_FOUND',
        message: 'This quiz session has expired. Please generate a new quiz.',
      });
      return;
    }

    // Check for missing or unclear answers
    const missingQuestions: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const ans = answers[i] || answers[String(i)];
      if (!ans || !['A', 'B', 'C', 'D'].includes(String(ans).trim().toUpperCase())) {
        missingQuestions.push(i);
      }
    }

    if (missingQuestions.length > 0) {
      const missingList = missingQuestions.join(', ');
      res.status(400).json({
        error: 'MISSING_OR_UNCLEAR_ANSWER',
        missingQuestions,
        message: `Answer missing or unclear for question ${missingList}. Please select or clarify an option (A, B, C, or D) for every question before grading.`,
      });
      return;
    }

    // Grade each question
    let score = 0;
    const feedback = questions.map((q) => {
      const rawAns = answers[q.id] || answers[String(q.id)];
      const studentOption = String(rawAns).trim().toUpperCase() as 'A' | 'B' | 'C' | 'D';
      const isCorrect = studentOption === q.correctOption;
      if (isCorrect) {
        score += 1;
      }

      const studentOptionText = q.options.find((o) => o.label === studentOption)?.text || '';
      const correctOptionText = q.options.find((o) => o.label === q.correctOption)?.text || '';

      return {
        id: q.id,
        question: q.question,
        options: q.options,
        studentAnswer: studentOption,
        studentAnswerText: studentOptionText,
        correctAnswer: q.correctOption,
        correctAnswerText: correctOptionText,
        isCorrect,
        explanation: q.explanation,
      };
    });

    let overallFeedback = '';
    if (score === 3) {
      overallFeedback = 'Perfect score (3/3)! You have demonstrated complete mastery of this study material.';
    } else if (score === 2) {
      overallFeedback = 'Great job (2/3)! You have a solid grasp of the core concepts. Review the explanation for the missed question to reinforce your notes.';
    } else if (score === 1) {
      overallFeedback = 'You scored 1/3. Review the explanations below carefully alongside your study notes to clarify key distinctions.';
    } else {
      overallFeedback = 'Score: 0/3. Re-read your notes with attention to the explanations below, then try another practice quiz when you are ready.';
    }

    res.json({
      score,
      total: 3,
      feedback,
      overallFeedback,
    });
  } catch (error: any) {
    console.error('Error grading quiz:', error);
    res.status(500).json({
      error: 'GRADING_FAILED',
      message: error?.message || 'Failed to grade answers. Please try again.',
    });
  }
});

// Serve frontend in dev or prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz Assistant Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
