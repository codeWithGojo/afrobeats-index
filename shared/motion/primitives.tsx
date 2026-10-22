"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useInView,
  animate,
  type HTMLMotionProps,
} from "motion/react";
import { spring, reveal, item, list, countryList } from "./config";
export function PressButton({ children, ...props }: HTMLMotionProps<"button">) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      data-motion-owned
      whileHover={reduced ? undefined : { scale: 1.03 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={spring}
      {...props}
    >
      {children}
    </motion.button>
  );
}
export function MotionCard({ children, ...props }: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      data-motion-owned
      whileHover={reduced ? undefined : { y: -4, scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={spring}
      {...props}
    >
      {children}
    </motion.div>
  );
}
export function Reveal({
  children,
  className = "",
  country = false,
}: {
  children: ReactNode;
  className?: string;
  country?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.06 }}
      variants={country ? countryList : list}
    >
      {children}
    </motion.div>
  );
}
export function RevealItem({ children, ...props }: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion();
  return (
    <motion.div {...props} variants={reduced ? {} : item}>
      {children}
    </motion.div>
  );
}
export function AnimatedValue({
  value,
  children,
  className = "",
}: {
  value: string | number;
  children?: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={String(value)}
        className={className}
        initial={reduced ? false : { opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: -3 }}
        transition={reveal}
      >
        {children ?? value}
      </motion.span>
    </AnimatePresence>
  );
}
export function CountUp({
  value,
  digits = 0,
  suffix = "",
  className = "",
}: {
  value: number;
  digits?: number;
  suffix?: string;
  className?: string;
}) {
  const reduced = useReducedMotion(),
    ref = useRef<HTMLSpanElement>(null),
    inView = useInView(ref, { once: true }),
    number = useMotionValue(value);
  const formatted = useTransform(
    number,
    (n) =>
      new Intl.NumberFormat("en", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(n) + suffix,
  );
  useEffect(() => {
    if (!Number.isFinite(value)) return;
    number.set(reduced ? value : 0);
    if (!inView || reduced) {
      number.set(value);
      return;
    }
    const control = animate(number, value, { duration: 0.7, ease: "easeOut" });
    return () => control.stop();
  }, [value, reduced, inView, number]);
  return (
    <motion.span
      ref={ref}
      className={className}
      aria-label={`${value.toLocaleString("en")}${suffix}`}
    >
      {formatted}
    </motion.span>
  );
}
export function StatBar({
  value,
  className = "",
  delay = 0,
}: {
  value: number;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={className}
      initial={reduced ? false : { width: 0 }}
      whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      viewport={{ once: true }}
      transition={{ ...reveal, delay: reduced ? 0 : delay }}
    />
  );
}
export function TextReveal({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={`mk-words ${className}`}
      aria-label={text}
      initial={reduced ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true }}
      variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
    >
      {text.split(" ").map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          aria-hidden="true"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: reveal },
          }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </motion.span>
  );
}
export function Skeleton({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <span
      role="status"
      aria-label={label}
      className={`mk-skeleton ${className}`}
    >
      <span className="mk-sr">{label}</span>
      <motion.span
        aria-hidden="true"
        className="mk-shimmer"
        animate={reduced ? undefined : { x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}
export function ActivePill({ active, id }: { active: boolean; id: string }) {
  const reduced = useReducedMotion();
  return active ? (
    <motion.span
      className="mk-active-pill"
      aria-hidden="true"
      layoutId={reduced ? undefined : id}
      transition={spring}
    />
  ) : null;
}
export function Typewriter({ text }: { text: string }) {
  const reduced = useReducedMotion(),
    ref = useRef<HTMLSpanElement>(null),
    visible = useInView(ref, { once: true }),
    [count, setCount] = useState(text.length);
  useEffect(() => {
    if (reduced || !visible) return;
    const control = animate(0, text.length, {
      duration: Math.min(1.6, text.length * 0.016),
      ease: "linear",
      onUpdate: (n) => setCount(Math.floor(n)),
    });
    return () => control.stop();
  }, [visible, reduced, text]);
  return (
    <span ref={ref} aria-label={text}>
      <span aria-hidden="true">
        {reduced ? text : text.slice(0, count)}
        {count < text.length ? (
          <span style={{ visibility: "hidden" }}>{text.slice(count)}</span>
        ) : null}
      </span>
    </span>
  );
}
