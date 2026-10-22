import { useLayoutEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  animate,
} from "motion/react";
import { reveal } from "../../shared/motion/config";

// Keep legacy markup and delegated actions intact while animating a whole comparison.
function ComparisonMarkup({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null),
    reduced = useReducedMotion();
  useLayoutEffect(() => {
    if (reduced || !ref.current) return;
    const controls = [...ref.current.querySelectorAll(".vs-head")].map(
      (node, i) =>
        animate(node, { opacity: [0, 1], x: [i === 0 ? -24 : 24, 0] }, reveal),
    );
    ref.current
      .querySelectorAll<HTMLElement>(".vs-metric-bar>span")
      .forEach((node, i) => {
        const width = node.style.width;
        controls.push(
          animate(
            node,
            { width: ["0%", width] },
            { ...reveal, delay: Math.floor(i / 2) * 0.08 },
          ),
        );
      });
    return () => controls.forEach((control) => control.stop());
  }, [html, reduced]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
export function LegacyTransition({ html, id }: { html: string; id: string }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={reveal}
      >
        <ComparisonMarkup html={html} />
      </motion.div>
    </AnimatePresence>
  );
}
