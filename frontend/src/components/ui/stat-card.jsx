import * as React from "react";
import { motion } from "motion/react";
import { cn } from "./utils";

function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  color = "text-slate-900",
  bgColor = "bg-slate-100",
  gradient,
  change,
  changeType,
  onClick,
  className,
  delay = 0,
  ...props 
}) {
  const content = (
    <>
      {Icon && (
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          gradient ? `bg-gradient-to-br ${gradient} shadow-lg` : bgColor
        )}>
          <Icon 
            className={cn(
              "w-5 h-5",
              gradient ? "text-white" : color
            )}
            strokeWidth={2}
          />
        </div>
      )}
      <p className="text-slate-600 text-sm mb-1">{title}</p>
      <p className={cn("text-2xl mb-1", color)}>{value}</p>
      {change && (
        <p className={cn(
          "text-xs",
          changeType === 'positive' ? "text-green-600" : "text-red-600"
        )}>
          {change}
        </p>
      )}
    </>
  );

  const baseClasses = "bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all text-left";

  if (onClick) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(baseClasses, className)}
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn(baseClasses, className)}
      {...props}
    >
      {content}
    </motion.div>
  );
}

export { StatCard };
