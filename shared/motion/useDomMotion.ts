"use client";
import { useEffect } from "react";
import { animate, useReducedMotion } from "motion/react";
import { spring, reveal } from "./config";
// Existing controls keep their handlers and semantics; delegation covers dynamic lists too.
export function useDomMotion(
  revealSelector = "",
  dependency?: string,
  hoverScale = 1.03,
  hoverLift = 0,
) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const controls = new Map<Element, ReturnType<typeof animate>>(),
      seen = new WeakSet<Element>();
    const target = (event: Event) =>
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(
            "button:not(:disabled),a[href],summary",
          )
        : null;
    const excluded = (el: HTMLElement) =>
      Boolean(
        el.hasAttribute("data-motion-owned") ||
        el.closest("svg,.mk-cursor,.mk-top"),
      );
    const play = (el: HTMLElement, scale: number, y = 0) => {
      if (excluded(el)) return;
      controls.get(el)?.stop();
      controls.set(el, animate(el, { scale, y }, spring));
    };
    let pressed: HTMLElement | null = null;
    const over = (e: PointerEvent) => {
      const el = target(e);
      if (
        el &&
        e.pointerType === "mouse" &&
        matchMedia("(hover:hover)").matches
      )
        play(
          el,
          el.matches(".current-row,.ranking-row") ? 1 : hoverScale,
          hoverLift || (el.matches("[data-card],.country-card") ? -4 : 0),
        );
    };
    const out = (e: PointerEvent) => {
      const el = target(e);
      if (
        el &&
        (!(e.relatedTarget instanceof Node) || !el.contains(e.relatedTarget))
      )
        play(el, 1);
    };
    const down = (e: PointerEvent) => {
      const el = target(e);
      if (el) {
        pressed = el;
        play(el, 0.97);
      }
    };
    const up = () => {
      if (pressed) {
        play(pressed, 1);
        pressed = null;
      }
    };
    const key = (e: KeyboardEvent) => {
      if (!["Enter", " "].includes(e.key)) return;
      const el = target(e);
      if (el) {
        pressed = el;
        play(el, 0.97);
      }
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("keydown", key);
    document.addEventListener("keyup", up);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (!el.closest("[data-motion-owned]")) {
            const index = Array.from(el.parentElement?.children ?? []).indexOf(
              el,
            );
            controls.set(
              el,
              animate(
                el,
                { opacity: [0, 1], y: [12, 0] },
                { ...reveal, delay: Math.min(index % 5, 4) * 0.05 },
              ),
            );
          }
          observer.unobserve(el);
        }),
      { threshold: 0.05 },
    );
    const register = (root: Document | Element) => {
      if (!revealSelector) return;
      const found = [...root.querySelectorAll(revealSelector)];
      if (root instanceof Element && root.matches(revealSelector))
        found.unshift(root);
      found.forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          observer.observe(el);
        }
      });
    };
    register(document);
    const changes = new MutationObserver((records) =>
      records.forEach((r) => {
        r.addedNodes.forEach((n) => {
          if (n instanceof Element) register(n);
        });
        r.removedNodes.forEach((n) => {
          if (n instanceof Element) {
            observer.unobserve(n);
            if (revealSelector)
              n.querySelectorAll(revealSelector).forEach((el) =>
                observer.unobserve(el),
              );
          }
        });
      }),
    );
    changes.observe(document.querySelector("main") ?? document.body, {
      subtree: true,
      childList: true,
    });
    return () => {
      observer.disconnect();
      changes.disconnect();
      controls.forEach((c) => c.stop());
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("keydown", key);
      document.removeEventListener("keyup", up);
    };
  }, [reduced, revealSelector, dependency, hoverScale, hoverLift]);
}
