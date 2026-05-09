import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

function IconInput({ 
  icon: Icon, 
  className, 
  iconClassName,
  iconLeft = "left-4",
  inputPaddingLeft,
  floatingLabel = false,
  label,
  ...props 
}) {
  const defaultPadding = Icon ? (inputPaddingLeft || "pl-12") : "";
  const labelText = label || props.placeholder || "";
  const effectivePlaceholder = floatingLabel ? " " : props.placeholder;
  const labelLeftClass = Icon ? "left-12" : "left-4";
  
  return (
    <div className="relative">
      {Icon && (
        <Icon 
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none",
            iconLeft,
            iconClassName
          )} 
        />
      )}
      <Input
        className={cn(
          floatingLabel && "peer h-14 pt-5 pb-2",
          defaultPadding,
          className
        )}
        placeholder={effectivePlaceholder}
        {...props}
      />
      {floatingLabel && labelText && (
        <label
          htmlFor={props.id}
          className={cn(
            "absolute z-10 px-1 bg-white text-slate-400 text-sm pointer-events-none transition-all duration-200 ease-out",
            labelLeftClass,
            "top-1/2 -translate-y-1/2",
            "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600",
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm",
            "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:-translate-y-1/2 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-slate-600"
          )}
        >
          {labelText}
        </label>
      )}
    </div>
  );
}

export { IconInput };
