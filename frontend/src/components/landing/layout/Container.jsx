import React from "react";
import { cn } from "../../ui/utils";

export function Container({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
