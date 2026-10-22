import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  animate,
} from "motion/react";
import { modal, reveal } from "../../shared/motion/config";

// Adopt the existing search nodes, preserving their handlers and keyboard behaviour.
export function NativePalette({
  dialog,
  nodes,
  parking,
}: {
  dialog: HTMLDialogElement;
  nodes: Node[];
  parking: HTMLElement;
}) {
  const reduced = useReducedMotion(),
    [open, setOpen] = useState(dialog.open),
    previous = useRef<HTMLElement | null>(null);
  const close = useRef<() => void>(() => {});
  useEffect(() => {
    const show = dialog.showModal.bind(dialog),
      nativeClose = dialog.close.bind(dialog);
    close.current = () => {
      nodes.forEach((node) => parking.append(node));
      nativeClose();
      previous.current?.focus();
    };
    dialog.showModal = () => {
      previous.current = document.activeElement as HTMLElement;
      flushSync(() => setOpen(true));
      dialog.dataset.motionState = "open";
      show();
    };
    dialog.close = () => {
      dialog.dataset.motionState = "closing";
      setOpen(false);
    };
    const cancel = (event: Event) => {
      event.preventDefault();
      dialog.close();
    };
    const submit = (event: Event) => {
      if (
        event.target instanceof HTMLFormElement &&
        event.target.method === "dialog"
      ) {
        event.preventDefault();
        dialog.close();
      }
    };
    dialog.addEventListener("cancel", cancel);
    dialog.addEventListener("submit", submit);
    return () => {
      dialog.showModal = show;
      dialog.close = nativeClose;
      dialog.removeEventListener("cancel", cancel);
      dialog.removeEventListener("submit", submit);
    };
  }, [dialog, nodes, parking]);
  return (
    <AnimatePresence mode="wait" onExitComplete={() => close.current()}>
      {open && (
        <motion.div
          data-motion-owned
          variants={modal}
          initial={reduced ? false : "hidden"}
          animate="visible"
          exit={reduced ? undefined : "exit"}
          ref={(node) => {
            if (node) nodes.forEach((child) => node.append(child));
          }}
        >
          <SearchResults dialog={dialog} disabled={Boolean(reduced)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function SearchResults({
  dialog,
  disabled,
}: {
  dialog: HTMLDialogElement;
  disabled: boolean;
}) {
  useEffect(() => {
    if (disabled) return;
    const controls = new Set<ReturnType<typeof animate>>();
    const results = () =>
      dialog
        .querySelectorAll('a,[role="option"]')
        .forEach((node, i) =>
          controls.add(
            animate(
              node,
              { opacity: [0, 1], x: [-16, 0] },
              { ...reveal, delay: i * 0.03 },
            ),
          ),
        );
    results();
    const observer = new MutationObserver(results);
    observer.observe(dialog, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      controls.forEach((control) => control.stop());
    };
  }, [dialog, disabled]);
  return null;
}
