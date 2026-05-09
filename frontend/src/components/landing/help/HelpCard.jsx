import React from "react";

export function HelpCard({ icon: Icon, title, description, onClick, iconBgColor = "bg-sky-50", iconColor = "text-[#0284c7]" }) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 text-left w-full group"
    >
      {/* Icon */}
      <div className={`w-11 h-11 ${iconBgColor} dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-105 transition-transform`}>
        <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[#0f172a] dark:text-slate-100 mb-2 text-center">{title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center">{description}</p>
    </button>
  );
}
