import * as React from "react";
import { motion } from "motion/react";
import { cn } from "./utils";

function AlertCard({ 
  icon: Icon,
  title,
  children,
  gradient = "from-amber-400 to-orange-500",
  className,
  delay = 0,
  ...props 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "bg-gradient-to-br rounded-2xl p-6 shadow-lg text-white",
        gradient,
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1">
          {title && <h3 className="text-white mb-2">{title}</h3>}
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export { AlertCard };
