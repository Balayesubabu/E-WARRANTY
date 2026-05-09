import * as React from "react";
import { cn } from "./utils";

function IconButton({ 
  icon: Icon, 
  className,
  size = "default",
  ...props 
}) {
  const sizeClasses = {
    default: "w-12 h-12",
    sm: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <button
      className={cn(
        "rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn(
        size === "sm" ? "w-5 h-5" : size === "lg" ? "w-7 h-7" : "w-6 h-6"
      )} />}
    </button>
  );
}

export { IconButton };
