import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../ui/utils";

export function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-slate-900 dark:text-slate-100 pr-4">{question}</span>
        <span className="flex-shrink-0 text-[#0284c7]">
          {isOpen ? (
            <ChevronUp className="w-5 h-5" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-5 h-5" strokeWidth={2} />
          )}
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 pb-5 pt-0">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
