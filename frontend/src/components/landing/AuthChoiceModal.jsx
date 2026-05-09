import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, ArrowRight, LogIn, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const easeOut = [0.22, 1, 0.36, 1];

export function AuthChoiceModal({ open, onOpenChange }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const staggerParent = reduceMotion
    ? { hidden: {}, visible: { transition: { staggerChildren: 0, delayChildren: 0 } } }
    : {
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.055, delayChildren: 0.08 },
        },
      };

  const staggerItem = reduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { duration: 0 } },
      }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.38, ease: easeOut },
        },
      };

  const closeAndGo = (to, state) => {
    onOpenChange(false);
    navigate(to, state ? { state } : undefined);
  };

  const handleBusinessLogin = () => closeAndGo("/login");
  const handleBusinessSignup = () => closeAndGo("/owner-signup");

  const Card = ({
    tone = "sky",
    icon,
    title,
    subtitle,
    actions,
    footnote,
    actionsLayout = "stack",
  }) => {
    const tones = {
      sky: {
        ring: "focus-visible:ring-sky-500/30",
        border: "border-sky-100",
        bg: "bg-sky-50/50",
        iconBg: "bg-sky-500/10",
        iconText: "text-sky-700",
        primary: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500/30",
        secondary:
          "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus-visible:ring-sky-500/25",
      },
      amber: {
        ring: "focus-visible:ring-amber-500/30",
        border: "border-amber-100",
        bg: "bg-amber-50/50",
        iconBg: "bg-amber-500/10",
        iconText: "text-amber-700",
        primary: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/30",
        secondary:
          "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus-visible:ring-amber-500/25",
      },
      slate: {
        ring: "focus-visible:ring-slate-500/30",
        border: "border-slate-200",
        bg: "bg-slate-50/40",
        iconBg: "bg-slate-900/5",
        iconText: "text-slate-800",
        primary: "bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-500/30",
        secondary:
          "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus-visible:ring-slate-500/25",
      },
    };
    const t = tones[tone] ?? tones.sky;

    return (
      <section
        className={[
          "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border p-4 sm:p-5 text-left",
          "bg-white dark:bg-slate-800",
          "transition-all duration-300",
          "hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-900/10",
          "motion-reduce:transition-none motion-reduce:hover:transform-none",
          t.border,
        ].join(" ")}
        aria-label={title}
      >
        <div
          className={[
            "pointer-events-none absolute -inset-1 opacity-0 blur-2xl transition-opacity duration-300",
            "group-hover:opacity-100",
            "motion-reduce:transition-none",
            tone === "amber"
              ? "bg-radial from-amber-200/40 via-amber-100/10 to-transparent"
              : "bg-radial from-sky-200/40 via-sky-100/10 to-transparent",
          ].join(" ")}
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Keep consistent header height so action rows align across cards */}
          <div className="flex items-start gap-3.5 min-h-[92px] sm:min-h-[96px]">
          <div
            className={[
              "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center",
              "transition-transform duration-300",
              "group-hover:scale-110 group-hover:-rotate-2",
              "motion-reduce:transition-none motion-reduce:transform-none",
              t.iconBg,
            ].join(" ")}
          >
            <span className={t.iconText}>{icon}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{subtitle}</p>
          </div>
          </div>

          <div
            className={[
              "mt-4 grid shrink-0 gap-2",
              actionsLayout === "row" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            ].join(" ")}
          >
          {actions?.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={a.onClick}
              title={a.tooltip || undefined}
              className={[
                a.variant === "link"
                  ? "w-full inline-flex items-center justify-start gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  : "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-4",
                t.ring,
                a.variant === "secondary" ? t.secondary : a.variant === "link" ? "bg-transparent" : t.primary,
                actionsLayout === "row" ? "px-3" : "",
              ].join(" ")}
            >
              {a.icon}
              <span
                className={[
                  "truncate",
                  actionsLayout === "row" ? "whitespace-nowrap" : "",
                  a.variant === "link" ? "underline underline-offset-4" : "",
                ].join(" ")}
              >
                {a.label}
              </span>
              {a.showArrow ? (
                <ArrowRight className="w-4 h-4 shrink-0 opacity-90 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              ) : null}
            </button>
          ))}
          </div>

          {footnote ? (
            <p className="mt-auto pt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {footnote}
            </p>
          ) : null}
        </div>
      </section>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 p-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-[85vh]">
        <motion.div
          className="flex flex-col min-h-0"
          variants={staggerParent}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem}>
            <DialogHeader className="px-5 sm:px-7 pt-4 sm:pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 text-center">
                Choose how you want to continue
              </DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center mt-1">
                Pick the account type that matches what you’re trying to do.
              </p>
            </DialogHeader>
          </motion.div>

          <div className="overflow-y-auto min-h-0">
            <div className="p-4 sm:p-5 bg-linear-to-br from-slate-50/70 via-white to-slate-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:items-stretch">
                <motion.div
                  variants={staggerItem}
                  className="flex h-full min-h-0 w-full min-w-0 flex-col md:self-stretch"
                >
                  <Card
                    tone="amber"
                    icon={<Building2 className="w-6 h-6" />}
                    title="Business Owner"
                    subtitle="Owners, staff, dealers, and service centers sign in here."
                    actionsLayout="row"
                    actions={[
                      {
                        key: "business-login",
                        label: "Sign in",
                        onClick: handleBusinessLogin,
                        icon: <LogIn className="w-4 h-4" />,
                        showArrow: true,
                      },
                      {
                        key: "business-signup",
                        label: "Create account",
                        tooltip: "Create Business Account",
                        onClick: handleBusinessSignup,
                        variant: "secondary",
                        icon: <UserPlus className="w-4 h-4" />,
                        showArrow: false,
                      },
                    ]}
                    footnote="Use this if you manage warranties for a brand or dealer network."
                  />
                </motion.div>
              </div>
            </div>

            <motion.div
              variants={staggerItem}
              className="px-5 sm:px-7 py-3 flex items-center justify-center border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20 rounded-lg px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}