"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog@1.1.6";
import { XIcon } from "lucide-react@0.487.0";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "./utils";

/** Premium open: soft spring + eased fade; respects prefers-reduced-motion */
const easeOutExpo = [0.22, 1, 0.36, 1];

function usePanelEntrance() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return {
      initial: { opacity: 0.98 },
      animate: { opacity: 1 },
      transition: { duration: 0.15 },
    };
  }
  return {
    initial: {
      opacity: 0,
      scale: 0.94,
      y: 32,
      rotateX: 6,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
    },
    transition: {
      opacity: { duration: 0.42, ease: easeOutExpo },
      scale: { type: "spring", stiffness: 220, damping: 32, mass: 1.05 },
      y: { type: "spring", stiffness: 220, damping: 32, mass: 1.05 },
      rotateX: { type: "spring", stiffness: 200, damping: 34, mass: 1.05 },
    },
  };
}

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  const reduceMotion = useReducedMotion();
  return (
    <DialogPrimitive.Overlay ref={ref} asChild {...props}>
      <motion.div
        data-slot="dialog-overlay"
        className={cn(
          "fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]",
          className,
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0.12 }
            : { duration: 0.42, ease: easeOutExpo }
        }
      />
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const entrance = usePanelEntrance();
  return (
  <DialogPortal data-slot="dialog-portal">
    <DialogOverlay />
    <DialogPrimitive.Content asChild data-slot="dialog-content" {...props}>
      <motion.div
        ref={ref}
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6",
          "bg-background shadow-xl shadow-slate-900/15 will-change-transform",
          "transform-3d",
          "sm:max-w-lg",
          className,
        )}
        transformPerspective={1200}
        style={{ transformOrigin: "50% 92%" }}
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </motion.div>
    </DialogPrimitive.Content>
  </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};