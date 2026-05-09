import React from "react";

export function StepCard({ stepNumber, title, description, icon: Icon, iconBgColor = "bg-emerald-500" }) {
  return (
    <div className="relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-slate-100">
      {/* Step Number Circle */}
      <div className="relative mb-6">
        <div className="w-14 h-14 bg-[#0284c7] rounded-full flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-xl">{stepNumber}</span>
        </div>
        {/* Small icon badge */}
        <div className={`absolute -top-1 -right-1 w-7 h-7 ${iconBgColor} rounded-full flex items-center justify-center shadow-sm`}
             style={{ right: 'calc(50% - 35px)' }}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#0f172a] mb-3 text-center">{title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed text-center">{description}</p>
    </div>
  );
}
