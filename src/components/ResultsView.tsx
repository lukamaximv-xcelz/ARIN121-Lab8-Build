import React from 'react';
import { QuizResult } from '../types';
import { CheckCircle, XCircle, RotateCcw, PlusCircle, Edit3, Award } from 'lucide-react';

interface ResultsViewProps {
  result: QuizResult;
  quizTitle: string;
  onRetake: () => void;
  onRequestNewQuiz: () => void;
  onEditNotes: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  quizTitle,
  onRetake,
  onRequestNewQuiz,
  onEditNotes,
}) => {
  const percentage = Math.round((result.score / result.total) * 100);

  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Assessment Results
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {quizTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-xl">
              {result.overallFeedback}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:px-6 shrink-0">
            <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums leading-tight">
                {result.score} / {result.total}
              </div>
              <div className="text-xs font-medium text-slate-500">
                {percentage}% Score
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onRetake}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={onEditNotes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Notes</span>
            </button>
          </div>

          <button
            onClick={onRequestNewQuiz}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Generate Another Quiz</span>
          </button>
        </div>
      </div>

      {/* Itemized Question Feedback */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">
            Question-by-Question Solutions & Explanations
          </h3>
          <span className="text-xs text-slate-500">
            Explanations cited strictly from study notes
          </span>
        </div>

        {result.feedback.map((item) => {
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-6 shadow-xs transition-all ${
                item.isCorrect
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-rose-200 hover:border-rose-300'
              }`}
            >
              {/* Question Header & Correctness Badge */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-md font-mono text-sm font-semibold text-white shrink-0 ${
                      item.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {item.id}
                  </span>
                  <h4 className="text-base font-semibold text-slate-900 leading-snug">
                    {item.question}
                  </h4>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${
                    item.isCorrect
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {item.isCorrect ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Correct (Option {item.studentAnswer})</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Incorrect (Your choice: {item.studentAnswer})</span>
                    </>
                  )}
                </div>
              </div>

              {/* Options breakdown */}
              <div className="space-y-2 mb-4 sm:pl-10">
                {item.options.map((opt) => {
                  const isUserSelection = opt.label === item.studentAnswer;
                  const isCorrectOption = opt.label === item.correctAnswer;

                  let borderClass = 'border-slate-200 bg-slate-50/60 text-slate-700';
                  let tag = null;

                  if (isCorrectOption) {
                    borderClass = 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-medium';
                    tag = (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 rounded px-1.5 py-0.5">
                        Correct Answer
                      </span>
                    );
                  } else if (isUserSelection && !item.isCorrect) {
                    borderClass = 'border-rose-300 bg-rose-50/80 text-rose-950 font-medium';
                    tag = (
                      <span className="text-[11px] font-semibold text-rose-700 bg-white border border-rose-200 rounded px-1.5 py-0.5">
                        Your Incorrect Choice
                      </span>
                    );
                  }

                  return (
                    <div
                      key={opt.label}
                      className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-sm ${borderClass}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                            isCorrectOption
                              ? 'bg-emerald-600 text-white'
                              : isUserSelection
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                      </div>
                      {tag && <div className="shrink-0">{tag}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              <div
                className={`p-4 rounded-lg text-sm sm:ml-10 ${
                  item.isCorrect
                    ? 'bg-slate-50 border border-slate-200 text-slate-700'
                    : 'bg-amber-50/80 border border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      item.isCorrect ? 'text-slate-600' : 'text-amber-800'
                    }`}
                  >
                    Explanation from Study Material:
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Final CTA */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Ready for the next round?</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Per instructions, new quizzes are only generated when you request one.
          </p>
        </div>
        <button
          onClick={onRequestNewQuiz}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate New Quiz</span>
        </button>
      </div>
    </div>
  );
};
