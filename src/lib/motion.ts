import type { Transition, Variants } from "motion/react";

export const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

export const duration = {
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
} as const;

export const pageTransition = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 1.005 },
  transition: { duration: duration.slow, ease: easeOut },
} as const;

export const fadeUp = (delay = 0) =>
  ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.slow, type: "spring", delay },
  }) as const;

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easeOut },
  },
};

export const listStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.06,
    },
  },
};

export const listItem: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: duration.fast, ease: easeOut },
  },
};
