import { motion } from 'motion/react';
import { cn } from '../ui/utils';

export function QuickActionCard({ 
  icon: Icon, 
  title, 
  description, 
  gradient, 
  onClick,
  delay = 0,
  className
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn("bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all text-left", className)}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" strokeWidth={2} />
      </div>
      <h3 className="text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm">{description}</p>
    </motion.button>
  );
}
