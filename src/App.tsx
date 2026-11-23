import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NotesInput } from './components/NotesInput';
import { QuizView } from './components/QuizView';
import { ResultsView } from './components/ResultsView';
import { QuizData, QuizResult, SampleNote } from './types';
import { BookOpenCheck, ShieldAlert, Sparkles } from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState<string>('');
  const [sampleNotes, setSampleNotes] = useState<SampleNote[]>([]);
  const [activeStep, setActiveStep] = useState<'notes' | 'quiz' | 'results'>('notes');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | undefined>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingQuestions, setMissingQuestions] = useState<number[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch sample notes on initial mount
  useEffect(() => {
    fetch('/api/sample-notes')
      .then((res) => res.json())
      .then((data) => {
        if (data?.samples) {
          setSampleNotes(data.samples);
        }
      })
      .catch((err) => {
        console.warn('Could not load sample notes from server:', err);
      });
  }, []);

  // Handle quiz generation
  const handleGenerateQuiz = async () => {
    if (!notes || !notes.trim()) {
      setErrorMessage('Please provide study notes first. Enter lecture notes, textbook excerpts, or topic summaries to generate a practice quiz.');
      return;
    }

    if (notes.trim().length < 20) {
      setErrorMessage('Please provide a little more detail in your study material (at least 20 characters) so 3 distinct questions can be generated.');
      return;
    }

    setErrorMessage(null);
    setServerError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate quiz.');
      }

      setQuizData(data);
      setAnswers({});
      setMissingQuestions([]);
      setActiveStep('quiz');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while generating the quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle selecting an option
  const handleSelectAnswer = (questionId: number, option: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
    // Clear missing question highlight if addressed
    setMissingQuestions((prev) => prev.filter((id) => id !== questionId));
    setServerError(null);
  };

  // Handle submitting answers
  const handleSubmitAnswers = async () => {
    if (!quizData) return;

    // Client-side verification for missing questions (Rule 4: if an answer is missing or unclear, ask the student to clarify before grading)
    const missing: number[] = [];
    for (let i = 1; i <= 3; i++) {
      if (!answers[i]) {
        missing.push(i);
      }
    }

    if (missing.length > 0) {
      setMissingQuestions(missing);
      setServerError(`Answer missing: Please choose an option for Question ${missing.join(', ')} before grading.`);
      // Focus or scroll to the first missing question
      const element = document.getElementById(`question-${missing[0]}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setMissingQuestions([]);
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData.quizId,
          token: quizData.token,
          answers,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.missingQuestions) {
          setMissingQuestions(data.missingQuestions);
        }
        throw new Error(data.message || 'Failed to grade answers.');
      }

      setQuizResult(data);
      setActiveStep('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while submitting answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retake the same quiz
  const handleRetake = () => {
    setAnswers({});
    setMissingQuestions([]);
    setServerError(null);
    setActiveStep('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Request new quiz from the notes (Rule 5: Do not generate another quiz unless the student requests one)
  const handleRequestNewQuiz = () => {
    handleGenerateQuiz();
  };

  // Reset to study notes
  const handleBackToNotes = () => {
    setActiveStep('notes');
    setServerError(null);
  };

  const handleFullReset = () => {
    setActiveStep('notes');
    setQuizData(null);
    setAnswers({});
    setQuizResult(null);
    setMissingQuestions([]);
    setErrorMessage(null);
    setServerError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onReset={handleFullReset} hasActiveQuiz={activeStep !== 'notes'} />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Helper Introduction Banner on Notes step */}
        {activeStep === 'notes' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>University Practice Companion</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Test your understanding from course material
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              Paste your study notes to generate exactly three targeted multiple-choice questions. Answers and explanations are kept hidden until you submit your choices.
            </p>
          </div>
        )}

        {/* Global Server Error if any */}
        {serverError && activeStep !== 'quiz' && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm animate-in fade-in"
          >
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{serverError}</p>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {activeStep === 'notes' && (
          <NotesInput
            notes={notes}
            setNotes={setNotes}
            onGenerate={handleGenerateQuiz}
            isLoading={isGenerating}
            sampleNotes={sampleNotes}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        )}

        {activeStep === 'quiz' && quizData && (
          <QuizView
            quiz={quizData}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            onSubmit={handleSubmitAnswers}
            isSubmitting={isSubmitting}
            onBackToNotes={handleBackToNotes}
            missingQuestions={missingQuestions}
            serverErrorMessage={serverError}
          />
        )}

        {activeStep === 'results' && quizResult && quizData && (
          <ResultsView
            result={quizResult}
            quizTitle={quizData.title}
            onRetake={handleRetake}
            onRequestNewQuiz={handleRequestNewQuiz}
            onEditNotes={handleBackToNotes}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-slate-400" />
            <span>Practice Quiz Assistant for University Students</span>
          </div>
          <div>
            <span>Questions & explanations strictly grounded in supplied notes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
