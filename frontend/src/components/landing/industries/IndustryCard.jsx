import React from "react";

export function IndustryCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7 text-[#0284c7]" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-semibold text-[#0f172a] mb-2">{title}</h3>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
