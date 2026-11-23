import React, { useState } from 'react';
import { QuizData } from '../types';
import { AlertCircle, Send, CheckCircle2, FileQuestion, ArrowLeft } from 'lucide-react';

interface QuizViewProps {
  quiz: QuizData;
  answers: Record<number, 'A' | 'B' | 'C' | 'D' | undefined>;
  onSelectAnswer: (questionId: number, option: 'A' | 'B' | 'C' | 'D') => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onBackToNotes: () => void;
  missingQuestions?: number[];
  serverErrorMessage?: string | null;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  answers,
  onSelectAnswer,
  onSubmit,
  isSubmitting,
  onBackToNotes,
  missingQuestions = [],
  serverErrorMessage,
}) => {
  const [shorthandInput, setShorthandInput] = useState('');
  const [shorthandMsg, setShorthandMsg] = useState<string | null>(null);

  // Compute completed count
  const answeredCount = [1, 2, 3].filter((id) => answers[id] !== undefined).length;

  // Handle shorthand text input such as "1B, 2D, 3A" or "1B 2D 3A"
  const handleApplyShorthand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shorthandInput.trim()) return;

    // Pattern matches things like 1A, 2b, 3-C, etc.
    const regex = /([1-3])\s*[-:]?\s*([a-dA-D])/g;
    let match;
    let appliedCount = 0;

    while ((match = regex.exec(shorthandInput)) !== null) {
      const qId = parseInt(match[1], 10);
      const letter = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
      onSelectAnswer(qId, letter);
      appliedCount++;
    }

    if (appliedCount > 0) {
      setShorthandMsg(`Updated ${appliedCount} question answer${appliedCount > 1 ? 's' : ''}.`);
      setTimeout(() => setShorthandMsg(null), 3000);
      setShorthandInput('');
    } else {
      setShorthandMsg('Format not recognized. Use format such as "1B, 2D, 3A".');
      setTimeout(() => setShorthandMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <FileQuestion className="w-4 h-4" />
              <span>3-Question Practice Quiz</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {quiz.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToNotes}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Notes</span>
            </button>
            <div className="text-xs font-mono tabular-nums px-3 py-1.5 rounded-md bg-slate-100 text-slate-700">
              {answeredCount} of 3 Answered
            </div>
          </div>
        </div>

        {/* Student Submission Prompt requirement */}
        <div className="mt-4 p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 text-indigo-950 text-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="font-semibold text-indigo-700 whitespace-nowrap">Submission Guide:</span>
            <span className="text-indigo-900">
              Submit your answers using the question number and option letter, such as <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-800">1B, 2D, 3A</strong>. Click each option below or use the shorthand input.
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-indigo-900 bg-white/80 border border-indigo-200/80 px-3 py-1.5 rounded shrink-0">
            <span className="text-indigo-500 font-sans">Current:</span>
            <span>1{answers[1] || '—'} · 2{answers[2] || '—'} · 3{answers[3] || '—'}</span>
          </div>
        </div>

        {/* Missing Answer Alert Banner */}
        {(missingQuestions.length > 0 || serverErrorMessage) && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm animate-in fade-in duration-200"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {serverErrorMessage || `Answer missing or unclear for Question ${missingQuestions.join(', ')}.`}
              </p>
              <p className="text-xs text-amber-800">
                Please select or clarify an answer (A, B, C, or D) for every question before grading.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-5">
        {quiz.questions.map((q) => {
          const isMissing = missingQuestions.includes(q.id);
          const currentSelected = answers[q.id];

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className={`bg-white rounded-xl border transition-all p-6 shadow-xs ${
                isMissing
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-900 text-white font-mono text-sm font-semibold shrink-0">
                  {q.id}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {q.question}
                  </h3>
                  {isMissing && (
                    <span className="inline-block mt-1 text-xs font-medium text-amber-700">
                      * Please select an answer for this question
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Options: A, B, C, D */}
              <div className="grid grid-cols-1 gap-2.5 sm:pl-10">
                {q.options.map((option) => {
                  const isSelected = currentSelected === option.label;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => onSelectAnswer(q.id, option.label)}
                      className={`group w-full text-left flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-all ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 group-hover:border-slate-400'
                        }`}
                      >
                        {option.label}
                      </span>
                      <span className="flex-1 pt-0.5 leading-relaxed font-normal">
                        {option.text}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Card & Shorthand Tool */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        {/* Shorthand Text Box option */}
        <form onSubmit={handleApplyShorthand} className="flex flex-col sm:flex-row items-center gap-2.5 pb-4 border-b border-slate-100">
          <label htmlFor="shorthand-input" className="text-xs text-slate-600 whitespace-nowrap font-medium">
            Fast Code Input:
          </label>
          <input
            id="shorthand-input"
            type="text"
            value={shorthandInput}
            onChange={(e) => setShorthandInput(e.target.value)}
            placeholder="e.g. 1B, 2D, 3A"
            className="flex-1 w-full sm:w-auto px-3 py-1.5 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            Apply Code
          </button>
          {shorthandMsg && (
            <span className="text-xs text-indigo-700 font-medium">{shorthandMsg}</span>
          )}
        </form>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Answers remain securely hidden until you submit.
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Grading Your Quiz...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Answers (Grade Quiz)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
