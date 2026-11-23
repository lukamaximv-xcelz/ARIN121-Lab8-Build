import React, { useState } from 'react';
import { BookOpen, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { SampleNote } from '../types';

interface NotesInputProps {
  notes: string;
  setNotes: (notes: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  sampleNotes: SampleNote[];
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  notes,
  setNotes,
  onGenerate,
  isLoading,
  sampleNotes,
  errorMessage,
  setErrorMessage,
}) => {
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  const handleSelectSample = (sample: SampleNote, index: number) => {
    setNotes(sample.content);
    setActivePresetIndex(index);
    setErrorMessage(null);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setActivePresetIndex(null);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner / Prompt Card */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Study Material & Notes
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Paste your lecture slides, textbook notes, or study summaries. The assistant will analyze this material to construct exactly 3 multiple-choice practice questions.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded px-2.5 py-1 tabular-nums">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{wordCount} words · {charCount} chars</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-5">
        {/* Empty Notes / Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm animate-in fade-in duration-200"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-amber-700 text-xs">
                Tip: You can paste your own notes below, or click any sample study topic below to load realistic university notes.
              </p>
            </div>
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <label htmlFor="study-notes" className="sr-only">
            Study Notes Content
          </label>
          <textarea
            id="study-notes"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Paste your study notes here... For example:
• Key concepts, definitions, formulas, or chronological facts
• Mechanisms and cause-and-effect relationships
• Differences between models or theories"
            rows={9}
            className={`w-full rounded-lg border p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 bg-white transition-all focus:outline-none focus:ring-2 ${
              errorMessage
                ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-100'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />
        </div>

        {/* Quick Sample Presets */}
        {sampleNotes.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Quick load university sample notes:</span>
              {notes && (
                <button
                  type="button"
                  onClick={() => {
                    setNotes('');
                    setActivePresetIndex(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear notes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {sampleNotes.map((sample, idx) => (
                <button
                  key={sample.topic}
                  type="button"
                  onClick={() => handleSelectSample(sample, idx)}
                  className={`text-left p-3 rounded-lg border transition-all text-xs ${
                    activePresetIndex === idx
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 ring-1 ring-indigo-300'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold truncate">{sample.topic}</span>
                    {activePresetIndex === idx && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-slate-500 line-clamp-1">{sample.preview}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Strict constraint: 3 questions generated solely from provided notes</span>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating 3 Practice Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
