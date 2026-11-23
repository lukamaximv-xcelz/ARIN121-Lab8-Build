import React from 'react';
import { GraduationCap, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasActiveQuiz: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasActiveQuiz }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              Practice Quiz Assistant
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              University Study Quiz Generator
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation / Stages */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-500">
          <span className="text-slate-900 font-semibold">1. Enter Notes</span>
          <span className="text-slate-300">/</span>
          <span className={hasActiveQuiz ? 'text-slate-900 font-semibold' : ''}>2. Solve 3 Questions</span>
          <span className="text-slate-300">/</span>
          <span>3. Feedback & Explanations</span>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {hasActiveQuiz && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
              title="Start over with new notes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start Over</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
