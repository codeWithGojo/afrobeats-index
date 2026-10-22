"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "motion/react";
import { spring, timings } from "./config";
export function notify(
  message: string,
  kind: "success" | "error" | "info" = "info",
) {
  if (typeof window !== "undefined" && message)
    window.dispatchEvent(
      new CustomEvent("motion:toast", { detail: { message, kind } }),
    );
}
type Toast = { id: number; message: string; kind: string };
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const reduced = useReducedMotion(),
    close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const timer = setTimeout(() => close.current(), timings.toast);
    return () => clearTimeout(timer);
  }, []);
  return (
    <motion.div
      layout
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 24 }}
      transition={reduced ? { duration: 0 } : spring}
      className={`mk-toast mk-toast-${toast.kind}`}
      role={toast.kind === "error" ? "alert" : "status"}
    >
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        ×
      </button>
      <motion.span
        className="mk-toast-progress"
        aria-hidden="true"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration: reduced ? 0 : timings.toast / 1000,
          ease: "linear",
        }}
        style={{ transformOrigin: "left" }}
      />
    </motion.div>
  );
}
export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]),
    next = useRef(0);
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail?.message !== "string") return;
      setToasts((t) => [
        ...t.slice(-2),
        {
          id: ++next.current,
          message: detail.message.slice(0, 240),
          kind: detail.kind || "info",
        },
      ]);
    };
    window.addEventListener("motion:toast", receive);
    return () => window.removeEventListener("motion:toast", receive);
  }, []);
  return (
    <div className="mk-toasts" aria-label="Notifications">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => setToasts((t) => t.filter((x) => x.id !== toast.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
export function Splash({ brand }: { brand: "afri" | "terra" | "portfolio" }) {
  const reduced = useReducedMotion(),
    [visible, setVisible] = useState(true);
  return (
    <AnimatePresence>
      {visible && !reduced && (
        <motion.div
          className="mk-splash"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, delay: 0.65, ease: "easeOut" }}
          onAnimationComplete={() => setVisible(false)}
        >
          <svg viewBox="0 0 80 80" width="80" height="80">
            <rect
              x="2"
              y="2"
              width="76"
              height="76"
              rx="16"
              fill="var(--mk-accent)"
            />
            <motion.path
              d={
                brand === "afri"
                  ? "M19 57 34 23h8l10 34M25 44h21M51 57l11-34"
                  : brand === "terra"
                    ? "M18 24h44M40 24v37M19 57c25 2 49-35 40-27S10 39 21 46"
                    : "M21 58V24h35M21 40h26"
              }
              fill="none"
              stroke="var(--mk-on-accent,#111)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function Cursor() {
  const reduced = useReducedMotion(),
    [fine, setFine] = useState(false),
    [over, setOver] = useState(false),
    [visible, setVisible] = useState(false),
    x = useMotionValue(-100),
    y = useMotionValue(-100),
    sx = useSpring(x, spring),
    sy = useSpring(y, spring);
  useEffect(() => {
    const media = matchMedia("(hover: hover) and (pointer: fine)");
    const change = () => setFine(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!fine || reduced) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setVisible(true);
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target instanceof Element ? e.target : null;
      setOver(
        Boolean(
          el?.closest(
            "a,button,[data-card],.country-card,.current-row,.hero-artist",
          ),
        ),
      );
    };
    const hide = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, [fine, reduced, x, y]);
  if (!fine || reduced) return null;
  return (
    <motion.div
      className="mk-cursor"
      aria-hidden="true"
      style={{ left: sx, top: sy }}
      animate={{ scale: over ? 2 : 1, opacity: visible ? 0.65 : 0 }}
      transition={spring}
    />
  );
}
export function ScrollChrome() {
  const reduced = useReducedMotion(),
    { scrollYProgress, scrollY } = useScroll(),
    [visible, setVisible] = useState(false),
    dash = useTransform(scrollYProgress, [0, 1], [100, 0]);
  useEffect(() => scrollY.on("change", (n) => setVisible(n > 600)), [scrollY]);
  return (
    <>
      <motion.div
        className="mk-progress"
        aria-hidden="true"
        style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
      />
      <AnimatePresence>
        {visible && (
          <motion.button
            data-motion-owned
            type="button"
            className="mk-top"
            aria-label="Back to top"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: reduced ? "instant" : "smooth",
              })
            }
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            transition={spring}
          >
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <circle
                cx="20"
                cy="20"
                r="17"
                pathLength="100"
                className="mk-ring-base"
              />
              <motion.circle
                cx="20"
                cy="20"
                r="17"
                pathLength="100"
                strokeDasharray="100"
                style={{ strokeDashoffset: dash }}
              />
            </svg>
            <span aria-hidden="true">↑</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
export function Confetti() {
  const reduced = useReducedMotion(),
    [burst, setBurst] = useState(0);
  useEffect(() => {
    const play = () => setBurst((n) => n + 1);
    window.addEventListener("motion:celebrate", play);
    return () => window.removeEventListener("motion:celebrate", play);
  }, []);
  return (
    <div className="mk-confetti" aria-hidden="true">
      <AnimatePresence>
        {burst && !reduced ? (
          <motion.div
            key={burst}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {Array.from({ length: 18 }, (_, i) => (
              <motion.i
                key={i}
                initial={{ x: 0, y: 0, rotate: 0 }}
                animate={{
                  x: (i - 8.5) * 24,
                  y: -90 - (i % 5) * 28,
                  rotate: (i % 2 ? 1 : -1) * 160,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{
                  background: ["var(--mk-accent)", "#edab6e", "#eee"][i % 3],
                }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
