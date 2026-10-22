"use client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  animate,
  type AnimationPlaybackControls,
} from "motion/react";
export function Marquee({
  children,
  label,
  duration = 35,
}: {
  children: ReactNode;
  label: string;
  duration?: number;
}) {
  const reduced = useReducedMotion(),
    x = useMotionValue("0%"),
    control = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    if (reduced) {
      x.set("0%");
      return;
    }
    const animation = animate(x, ["0%", "-100%"], {
      duration,
      repeat: Infinity,
      ease: "linear",
    });
    control.current = animation;
    return () => animation.stop();
  }, [duration, reduced, x]);
  return (
    <div
      className="mk-marquee"
      role="region"
      aria-label={label}
      onMouseEnter={() => control.current?.pause()}
      onMouseLeave={() => control.current?.play()}
      onFocusCapture={() => control.current?.pause()}
      onBlurCapture={() => control.current?.play()}
    >
      {reduced ? (
        <div className="mk-marquee-static">{children}</div>
      ) : (
        <div className="mk-marquee-track">
          <motion.div className="mk-marquee-group" style={{ x }}>
            {children}
          </motion.div>
          <motion.div
            className="mk-marquee-group mk-marquee-copy"
            aria-hidden="true"
            inert
            style={{ x }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </div>
  );
}
