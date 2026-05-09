import React from "react";

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      {/* Icon */}
      <div className="w-14 h-14 bg-sky-50 rounded-xl flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-[#0284c7]" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#0f172a] mb-3">{title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
