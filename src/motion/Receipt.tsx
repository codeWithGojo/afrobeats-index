import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { spring, reveal, list, item } from "../../shared/motion/config";
import { SwipeCard } from "../../shared/motion/gestures";
type Receipt = {
  artists: { name: string }[];
  tracks: { title: string; artist?: string }[];
  theme?: string;
  format?: string;
  annual?: { year: number; minutes: number; events: number };
};
export function ReceiptPrint({ canvas }: { canvas: HTMLCanvasElement }) {
  const reduced = useReducedMotion(),
    [print, setPrint] = useState<{
      image: string;
      key: string;
      label: string;
    } | null>(null),
    [story, setStory] = useState<Receipt | null>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const generated = (event: Event) => {
      const data = (event as CustomEvent<Receipt>).detail;
      if (data.format === "wrapped") setStory(data);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const image = URL.createObjectURL(blob);
        urls.current.push(image);
        setPrint({
          image,
          key: `${data.theme}-${Date.now()}`,
          label: `Music receipt. ${data.artists.map((a) => a.name).join(", ")}`,
        });
        canvas.classList.add("afri-export-canvas");
      });
    };
    const invalidate = () => {
      setPrint(null);
      setStory(null);
      canvas.classList.remove("afri-export-canvas");
    };
    window.addEventListener("afri:receipt-invalidated", invalidate);
    window.addEventListener("afri:receipt-generated", generated);
    window.addEventListener("afri:receipt-theme", generated);
    return () => {
      window.removeEventListener("afri:receipt-invalidated", invalidate);
      window.removeEventListener("afri:receipt-generated", generated);
      window.removeEventListener("afri:receipt-theme", generated);
      urls.current.forEach(URL.revokeObjectURL);
      canvas.classList.remove("afri-export-canvas");
    };
  }, [canvas]);
  return (
    <>
      <AnimatePresence mode="wait">
        {print && (
          <motion.div
            className="afri-print"
            key={print.key}
            initial={reduced ? false : { y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            role="img"
            aria-label={print.label}
          >
            <motion.div
              variants={list}
              initial={reduced ? false : "hidden"}
              animate="visible"
            >
              {Array.from({ length: 20 }, (_, i) => (
                <motion.div
                  key={i}
                  variants={reduced ? {} : item}
                  style={{
                    aspectRatio: `${canvas.width} / ${canvas.height / 20}`,
                    backgroundImage: `url(${print.image})`,
                    backgroundSize: "100% 2000%",
                    backgroundPosition: `center ${(i / 19) * 100}%`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {story && <Wrapped story={story} onClose={() => setStory(null)} />}
      </AnimatePresence>
    </>
  );
}
function Wrapped({ story, onClose }: { story: Receipt; onClose: () => void }) {
  const reduced = useReducedMotion(),
    [slide, setSlide] = useState(0),
    dialog = useRef<HTMLDialogElement>(null);
  const slides = [
    {
      title: story.annual
        ? `Your ${story.annual.year}, indexed`
        : "Your listening, indexed",
      text: story.annual
        ? `${story.annual.minutes} minutes · ${story.annual.events} African listening events`
        : "Your selected African artists and tracks",
    },
    {
      title: "The artists you chose",
      text: story.artists
        .slice(0, 5)
        .map((a) => a.name)
        .join(" · "),
    },
    {
      title: "On repeat",
      text:
        story.tracks
          .slice(0, 5)
          .map((t) => t.title)
          .join(" · ") || "Your artist selection leads this story.",
    },
  ];
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    if (reduced || slide === slides.length - 1) return;
    const timer = setTimeout(() => setSlide((s) => s + 1), 6000);
    return () => clearTimeout(timer);
  }, [slide, reduced, slides.length]);
  return (
    <dialog
      ref={dialog}
      className="afri-wrapped"
      onCancel={onClose}
      aria-label="Afri Wrapped story"
    >
      <button
        className="wrapped-close"
        onClick={onClose}
        aria-label="Close Wrapped"
      >
        ×
      </button>
      <div className="wrapped-progress">
        {slides.map((_, i) => (
          <div key={i}>
            <motion.span
              key={`${i}-${slide}`}
              initial={{ scaleX: i < slide ? 1 : 0 }}
              animate={{ scaleX: i <= slide ? 1 : 0 }}
              transition={{
                duration: i === slide && !reduced ? 6 : 0,
                ease: "linear",
              }}
            />
          </div>
        ))}
      </div>
      <SwipeCard
        onSwipe={(d) =>
          setSlide((s) => Math.max(0, Math.min(slides.length - 1, s + d)))
        }
      >
        <AnimatePresence mode="wait">
          <motion.section
            key={slide}
            initial={reduced ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={reveal}
          >
            <small>AFR / INDEX · WRAPPED</small>
            <h2>{slides[slide].title}</h2>
            <p>{slides[slide].text}</p>
          </motion.section>
        </AnimatePresence>
      </SwipeCard>
      <div className="wrapped-controls">
        <button disabled={!slide} onClick={() => setSlide((s) => s - 1)}>
          ← Back
        </button>
        <button
          onClick={() =>
            slide < slides.length - 1 ? setSlide((s) => s + 1) : onClose()
          }
        >
          {slide < slides.length - 1 ? "Next →" : "Done"}
        </button>
      </div>
    </dialog>
  );
}
