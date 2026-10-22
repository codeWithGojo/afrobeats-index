import type { Transition, Variants } from "motion/react";
export const spring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
};
export const reveal: Transition = {
  type: "tween",
  duration: 0.35,
  ease: "easeOut",
};
export const timings = {
  reveal: 0.35,
  stagger: 0.04,
  searchStagger: 0.03,
  countryStagger: 0.05,
  toast: 5000,
};
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: reveal },
  exit: { opacity: 0, transition: { ...reveal, duration: 0.2 } },
};
export const list: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
export const countryList: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
export const item: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: reveal },
  exit: { opacity: 0, transition: reveal },
};
export const route: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: reveal },
  exit: { opacity: 0, y: -8, transition: { ...reveal, duration: 0.18 } },
};
export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.96, transition: { ...reveal, duration: 0.18 } },
};
export const controls = { spring, reveal, timings };
