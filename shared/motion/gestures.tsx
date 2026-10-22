"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  useDragControls,
  type HTMLMotionProps,
} from "motion/react";
import { spring, reveal } from "./config";
export function MagneticButton({
  children,
  ...props
}: HTMLMotionProps<"button">) {
  const reduced = useReducedMotion(),
    x = useSpring(0, spring),
    y = useSpring(0, spring);
  return (
    <motion.button
      data-motion-owned
      {...props}
      style={{ ...props.style, x, y }}
      onPointerMove={(e) => {
        props.onPointerMove?.(e);
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.12);
        y.set((e.clientY - r.top - r.height / 2) * 0.12);
      }}
      onPointerLeave={(e) => {
        x.set(0);
        y.set(0);
        props.onPointerLeave?.(e);
      }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={spring}
    >
      {children}
    </motion.button>
  );
}
export function Accordion({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false),
    reduced = useReducedMotion();
  return (
    <div className={className}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduced ? { duration: 0 } : spring}
        >
          ⌄
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduced ? { duration: 0 } : reveal}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion(),
    dialog = useRef<HTMLDialogElement>(null),
    previous = useRef<HTMLElement | null>(null),
    dragControls = useDragControls();
  useEffect(() => {
    if (open) {
      previous.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    }
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="mk-drawer-dialog"
      data-motion-state={open?"open":"closing"}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <AnimatePresence
        onExitComplete={() => {
          dialog.current?.close();
          previous.current?.focus();
        }}
      >
        {open && (
          <motion.section
            className="mk-drawer"
            initial={reduced ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={spring}
            drag={reduced ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 85 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="mk-drawer-handle"
              aria-hidden="true"
              style={{ touchAction: "none", cursor: "grab" }}
              onPointerDown={(e) => dragControls.start(e)}
            />
            <header>
              <h2>{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close drawer">
                ×
              </button>
            </header>
            {children}
          </motion.section>
        )}
      </AnimatePresence>
    </dialog>
  );
}
export function SwipeCard({
  children,
  onSwipe,
  className = "",
}: {
  children: ReactNode;
  onSwipe: (direction: -1 | 1) => void;
  className?: string;
}) {
  const reduced = useReducedMotion(),
    x = useMotionValue(0),
    rotate = useTransform(x, [-200, 200], [-8, 8]);
  return (
    <motion.div
      className={className}
      data-motion-owned
      drag={reduced ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.25}
      style={{ x, rotate: reduced ? 0 : rotate, touchAction: "pan-y" }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 65) onSwipe(info.offset.x < 0 ? 1 : -1);
      }}
      transition={spring}
    >
      {children}
    </motion.div>
  );
}
export function FlagFlip({
  flag,
  label,
  facts,
  code,
}: {
  flag: string;
  label: string;
  facts: string;
  code: string;
}) {
  const [back, setBack] = useState(false),
    reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      className="mk-flag-flip"
      data-motion-owned
      aria-label={`${label}. ${facts}`}
      onHoverStart={() => setBack(true)}
      onHoverEnd={() => setBack(false)}
      onFocus={() => setBack(true)}
      onBlur={() => setBack(false)}
      onClick={() => setBack((v) => !v)}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      style={{ perspective: 600 }}
    >
      <motion.span
        layoutId={reduced ? undefined : `country-flag-${code}`}
        animate={reduced ? undefined : { rotateY: back ? 180 : 0 }}
        transition={spring}
        style={{ display: "inline-grid", transformStyle: "preserve-3d" }}
      >
        <span
          aria-hidden="true"
          style={{ gridArea: "1 / 1", backfaceVisibility: "hidden" }}
        >
          {flag}
        </span>
        <span
          aria-hidden="true"
          className="mk-flag-back"
          style={{
            gridArea: "1 / 1",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {facts}
        </span>
      </motion.span>
    </motion.button>
  );
}
export function MagneticLink({ children, ...props }: HTMLMotionProps<"a">) {
  const reduced = useReducedMotion(),
    x = useSpring(0, spring),
    y = useSpring(0, spring);
  return (
    <motion.a
      data-motion-owned
      {...props}
      style={{ ...props.style, x, y }}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.12);
        y.set((e.clientY - r.top - r.height / 2) * 0.12);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={spring}
    >
      {children}
    </motion.a>
  );
}
export function AnimatedDetails({
  summary,
  children,
  className = "",
}: {
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion(),
    [open, setOpen] = useState(false),
    [present, setPresent] = useState(false);
  return (
    <details className={className} open={present}>
      <summary
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          if (!open) setPresent(true);
          setOpen(!open);
        }}
      >
        {summary}
      </summary>
      <AnimatePresence initial={false} onExitComplete={() => setPresent(false)}>
        {open && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduced ? { duration: 0 } : reveal}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </details>
  );
}
