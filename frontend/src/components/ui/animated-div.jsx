import * as React from "react";
import { motion } from "motion/react";
import { cn } from "./utils";

const animationVariants = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scaleIn: {
    initial: { scale: 0 },
    animate: { scale: 1 },
  },
  slideInRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
};

function AnimatedDiv({
  variant = "fadeInUp",
  delay = 0,
  duration,
  className,
  children,
  initial,
  animate,
  transition,
  exit,
  ...props
}) {
  // Use custom initial/animate if provided, otherwise use variant
  const animationProps = initial || animate
    ? { initial, animate, exit }
    : {
        initial: animationVariants[variant]?.initial,
        animate: animationVariants[variant]?.animate,
      };

  // Build transition object
  const transitionProps = transition || {
    delay,
    ...(duration && { duration }),
  };

  // Special handling for scale variant (spring animation)
  if (variant === "scaleIn" && !transition) {
    transitionProps.type = "spring";
    transitionProps.stiffness = 200;
  }

  return (
    <motion.div
      {...animationProps}
      transition={transitionProps}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { AnimatedDiv, animationVariants };
