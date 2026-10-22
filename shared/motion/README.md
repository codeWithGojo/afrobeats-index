# Shared motion components

Both Afri Index and TerraScope bundle this same typed source. They are independent repositories; keep the two `shared/motion` folders identical when editing presets. The portfolio uses the same config and delegated press helper.

| File | Purpose |
| --- | --- |
| `config.ts` | Spring 500/40, easeOut reveal 0.35s, list/search stagger and route/modal variants |
| `primitives.tsx` | PressButton, MotionCard, CountUp, StatBar, TextReveal, Typewriter, Skeleton, ActivePill, Reveal and AnimatedValue |
| `gestures.tsx` | Magnetic controls, height-auto accordion/details, swipe card, flag flip and accessible native-dialog drawer |
| `overlays.tsx` | SVG splash, desktop follower cursor, stacked timed toasts, confetti, scroll progress and back-to-top ring |
| `Marquee.tsx` | Continuous ticker with hover/focus pause; a static readable strip under reduced motion |
| `useDomMotion.ts` | Delegated spring hover/press for existing and dynamically added native controls, plus once-only reveals |
| `styles.css` | Scoped styles using each application's existing color variables |

Import components from these files and transitions from `config.ts`. Every component uses `useReducedMotion`; continuous decoration, parallax, counters, typewriting and drag rotation are disabled for the operating-system preference. Do not add a separate decorative-motion pause button. Drawers and palettes retain native dialog focus containment, Escape and visible close buttons. Keep `data-motion-owned` on controls with their own Motion gestures to prevent delegated duplicates.

`notify(message, kind)` emits a toast. `motion:celebrate` emits a confetti burst. Success effects must follow an actual successful operation. Exported PNGs remain static images.
