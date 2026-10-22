/// <reference path="./globals.d.ts" />
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  LayoutGroup,
  useReducedMotion,
  animate,
} from "motion/react";
import { spring, reveal, route } from "../../shared/motion/config";
import {
  Cursor,
  Splash,
  ToastHost,
  ScrollChrome,
  Confetti,
  notify,
} from "../../shared/motion/overlays";
import {
  ActivePill,
  TextReveal,
  Skeleton,
} from "../../shared/motion/primitives";
import { Drawer, MagneticLink } from "../../shared/motion/gestures";
import { Marquee } from "../../shared/motion/Marquee";
import { useDomMotion } from "../../shared/motion/useDomMotion";
import { Ranking, HtmlRanking, ArtistCompare, type HtmlRow } from "./Ranking";
import { ReceiptPrint } from "./Receipt";
import { CollabGraph } from "./Graph";
import { LegacyTransition } from "./LegacyTransition";
import { NativePalette } from "./NativePalette";
import "../../shared/motion/styles.css";
const roots = new Map<HTMLElement, Root>();
function mount(el: HTMLElement, content: React.ReactNode) {
  let root = roots.get(el);
  if (!root) {
    el.replaceChildren();
    root = createRoot(el);
    roots.set(el, root);
  }
  root.render(<MotionConfig reducedMotion="user">{content}</MotionConfig>);
}
function readRows(html: string): HtmlRow[] {
  const template = document.createElement("template");
  template.innerHTML = html;
  return [...template.content.children].map((el, i) => ({
    key:
      el.getAttribute("data-key") ||
      el.querySelector('a[href*="/current/"]')?.getAttribute("href") ||
      el.getAttribute("href") ||
      el.textContent
        ?.replace(/^\s*#?\d+/, "")
        .trim()
        .slice(0, 80) ||
      String(i),
    tag: el.tagName.toLowerCase(),
    html: el.innerHTML,
    attrs: Object.fromEntries(
      [...el.attributes]
        .filter((a) => !a.name.startsWith("on") && a.name !== "style")
        .map((a) => [a.name === "class" ? "className" : a.name, a.value]),
    ),
  }));
}
function motionList(el: HTMLElement, html: string) {
  mount(el, <HtmlRanking rows={readRows(html)} />);
}
function announceVote(winner: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const buttons =
    winner.parentElement?.querySelectorAll<HTMLElement>("[data-vote]");
  buttons?.forEach((button) =>
    animate(
      button,
      button === winner ? { scale: 1.08 } : { opacity: 0.45, scale: 0.94 },
      spring,
    ).then(() => {
      if (button === winner) animate(button, { scale: 1 }, spring);
    }),
  );
  window.dispatchEvent(new Event("motion:celebrate"));
}
window.AfriMotion = {
  swap: (el, html, id) => mount(el, <LegacyTransition html={html} id={id} />),
  list: motionList,
  compare: (el, artists) => mount(el, <ArtistCompare artists={artists} />),
  graph: (el, artist, nodes) =>
    mount(el, <CollabGraph artist={artist} nodes={nodes} />),
  notify,
  vote: announceVote,
};
function Equalizer() {
  const reduced = useReducedMotion();
  return (
    <span className="afri-equalizer" aria-label="Featured artist">
      {[0, 1, 2, 3].map((i) => (
        <motion.i
          key={i}
          animate={reduced ? { scaleY: 1 } : { scaleY: [0.3, 1, 0.4] }}
          transition={{
            duration: 0.7 + i * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
function Tabs() {
  const [buttons, setButtons] = useState<HTMLElement[]>([]),
    [version, setVersion] = useState(0);
  useEffect(() => {
    const scan = () => {
      setButtons([
        ...document.querySelectorAll<HTMLElement>(
          ".nav-btn,[data-receipt-theme],.board-tabs a,.ranking-tabs button",
        ),
      ]);
      setVersion((v) => v + 1);
    };
    scan();
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.type === "attributes")) scan();
    });
    observer.observe(document.querySelector("header") ?? document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: [
        "aria-selected",
        "aria-current",
        "aria-pressed",
        "class",
      ],
    });
    document.addEventListener("click", scan);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", scan);
    };
  }, []);
  return (
    <LayoutGroup id="afri-active-tabs">
      {buttons.map((button, i) =>
        createPortal(
          <ActivePill
            active={
              button.classList.contains("nav-active") ||
              button.classList.contains("is-selected") ||
              button.getAttribute("aria-pressed") === "true" ||
              button.getAttribute("aria-current") === "page"
            }
            id={`afri-tab-${button.closest("nav,fieldset")?.getAttribute("id") || button.parentElement?.className || i}`}
          />,
          button,
          `${i}-${version ? 1 : 0}`,
        ),
      )}
    </LayoutGroup>
  );
}
function MobileDrawer() {
  const [open, setOpen] = useState(false),
    [html, setHtml] = useState("");
  useEffect(() => {
    const menu = document.getElementById("more-menu");
    const click = (e: MouseEvent) => {
      if (
        !matchMedia("(max-width:760px)").matches ||
        !(e.target instanceof Element) ||
        !e.target.closest("#more-menu>summary")
      )
        return;
      e.preventDefault();
      setHtml(menu?.querySelector(":scope>div")?.innerHTML ?? "");
      setOpen(true);
    };
    menu?.addEventListener("click", click);
    return () => menu?.removeEventListener("click", click);
  }, []);
  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="Explore Afri Index"
    >
      <div
        className="afri-drawer-links"
        onClick={(e) => {
          if (e.target instanceof Element && e.target.closest(".app-install")) {
            document
              .querySelector<HTMLButtonElement>("#more-menu .app-install")
              ?.click();
            setOpen(false);
            return;
          }
          const target =
            e.target instanceof Element ? e.target.closest("[data-tab]") : null;
          if (target) {
            document
              .querySelector<HTMLElement>(
                `#more-menu [data-tab="${target.getAttribute("data-tab")}"]`,
              )
              ?.click();
          }
          setOpen(false);
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Drawer>
  );
}
function Experience() {
  const reduced = useReducedMotion();
  useDomMotion(
    ".index-shortcuts>a,.quiz-artist-card,.question-panel,.result-panel,#studio>section",
  );
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "off" : "on";
  }, [reduced]);
  useEffect(() => {
    const running = new Set<ReturnType<typeof animate>>(),
      bound = new WeakSet<Element>();
    const observe = new MutationObserver((records) =>
      records.forEach((record) =>
        record.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) enhance(n);
        }),
      ),
    );
    const enhance = (root: Document | HTMLElement) => {
      root.querySelectorAll<HTMLElement>("#studio .panel").forEach((panel) => {
        if (panel.querySelector(":scope>[data-motion-rows]")) return;
        const rows = [
          ...panel.querySelectorAll<HTMLElement>(
            ":scope>.row[data-motion-list-item]",
          ),
        ];
        if (!rows.length) return;
        const host = document.createElement("div");
        host.dataset.motionRows = "true";
        rows[0].before(host);
        const html = rows.map((r) => r.outerHTML).join("");
        rows.forEach((r) => r.remove());
        motionList(host, html);
      });
      root.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) => {
        if (bound.has(dialog)) return;
        bound.add(dialog);
        if (dialog.matches(".afri-command,#command-dialog")) {
          const nodes = [...dialog.childNodes],
            host = document.createElement("div"),
            parking = document.createElement("div");
          parking.hidden = true;
          nodes.forEach((node) => parking.append(node));
          dialog.replaceChildren(parking, host);
          dialog.dataset.motionOwned = "true";
          mount(
            host,
            <NativePalette dialog={dialog} nodes={nodes} parking={parking} />,
          );
          return;
        }
        const toggle = () => {
          if (
            dialog.open &&
            !matchMedia("(prefers-reduced-motion:reduce)").matches
          ) {
            running.add(
              animate(dialog, { opacity: [0, 1], scale: [0.96, 1] }, reveal),
            );
            dialog
              .querySelectorAll("a,[role=option],#command-results>*")
              .forEach((node, i) =>
                running.add(
                  animate(
                    node,
                    { opacity: [0, 1], x: [-8, 0] },
                    { ...reveal, delay: i * 0.03 },
                  ),
                ),
              );
          }
        };
        dialog.addEventListener("toggle", toggle);
      });
      root
        .querySelectorAll<HTMLDetailsElement>("details:not(#more-menu)")
        .forEach((details) => {
          if (bound.has(details)) return;
          bound.add(details);
          const summary = details.querySelector("summary");
          if (!summary) return;
          const body = document.createElement("div");
          body.className = "afri-accordion-body";
          while (summary.nextSibling) body.append(summary.nextSibling);
          details.append(body);
          summary.addEventListener("click", (event) => {
            if (reduced) return;
            event.preventDefault();
            const closing = details.open,
              from = closing ? body.scrollHeight : 0;
            details.open = true;
            const control = animate(
              body,
              {
                height: [from, closing ? 0 : body.scrollHeight],
                opacity: closing ? [1, 0] : [0, 1],
              },
              reveal,
            );
            running.add(control);
            control.then(() => {
              details.open = !closing;
              body.style.height = "";
              body.style.opacity = "";
            });
          });
        });
    };
    enhance(document);
    observe.observe(document.body, { childList: true, subtree: true });
    return () => {
      observe.disconnect();
      running.forEach((c) => c.stop());
    };
  }, [reduced]);
  return (
    <>
      <Cursor />
      <ToastHost />
      <ScrollChrome />
      <Confetti />
      <Splash brand="afri" />
      <Tabs />
      <MobileDrawer />
    </>
  );
}
function RouteFrame({ node }: { node: HTMLElement }) {
  const reduced = useReducedMotion(),
    slot = useRef<HTMLDivElement>(null),
    [visible, setVisible] = useState(true),
    destination = useRef("");
  useLayoutEffect(() => {
    slot.current?.append(node);
  }, [node]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target ||
        link.download
      )
        return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname === location.pathname ||
        url.pathname.startsWith("/api/") ||
        reduced
      )
        return;
      event.preventDefault();
      destination.current = url.href;
      setVisible(false);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [reduced]);
  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (destination.current) location.assign(destination.current);
      }}
    >
      {visible && (
        <motion.div
          key={location.pathname}
          initial={reduced ? false : "hidden"}
          animate="visible"
          exit={reduced ? undefined : "exit"}
          variants={route}
        >
          <div ref={slot} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function init() {
  document
    .querySelectorAll<HTMLElement>("[data-motion-loader]")
    .forEach((el) => mount(el, <Skeleton label="Loading the index" />));
  const main = document.querySelector<HTMLElement>("main");
  if (main) {
    const frame = document.createElement("div");
    main.before(frame);
    createRoot(frame).render(<RouteFrame node={main} />);
  }
  const global = document.createElement("div");
  document.body.append(global);
  createRoot(global).render(
    <MotionConfig reducedMotion="user">
      <Experience />
    </MotionConfig>,
  );
  const versus = document.getElementById("vs-output");
  if (versus && versus.innerHTML)
    mount(
      versus,
      <LegacyTransition html={versus.innerHTML} id="initial-pair" />,
    );
  const chart = document.querySelector<HTMLElement>(".current-ranking");
  if (chart && window.AFRI_CURRENT_ARTISTS) {
    chart.dataset.motionRanking = "true";
    mount(chart, <Ranking artists={window.AFRI_CURRENT_ARTISTS} />);
  }
  const sandbox = document.querySelector<HTMLElement>("#sandbox-list");
  if (sandbox && sandbox.children.length)
    motionList(sandbox, sandbox.innerHTML);
  const ticker = document.createElement("div");
  ticker.className = "afri-live-ticker";
  const header = document.querySelector("header");
  header?.before(ticker);
  const artists = window.AFRI_CURRENT_ARTISTS ?? [];
  if (artists.length)
    mount(
      ticker,
      <Marquee label="Published weekly movers and daily streams">
        {[...artists]
          .sort((a, b) => b.previousRank - b.rank - (a.previousRank - a.rank))
          .slice(0, 8)
          .map((a) => (
            <span key={a.slug}>
              {a.name}{" "}
              <b>
                {a.previousRank > a.rank
                  ? "↑ " + (a.previousRank - a.rank)
                  : "—"}
              </b>{" "}
              ·{" "}
              {new Intl.NumberFormat("en", { notation: "compact" }).format(
                a.dailySpotifyStreams,
              )}{" "}
              daily Spotify · published snapshot
            </span>
          ))}
      </Marquee>,
    );
  else ticker.remove();
  const cta = document.querySelector<HTMLAnchorElement>(".hero-action");
  if (cta) {
    const host = document.createElement("span");
    const html = cta.innerHTML,
      href = cta.getAttribute("href") || "#current",
      className = cta.className;
    cta.replaceWith(host);
    mount(
      host,
      <MagneticLink
        href={href}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />,
    );
  }
  const featured = document.querySelector(
    ".hero-artist-1 .hero-photo-copy>small",
  );
  if (featured) {
    const node = document.createElement("span");
    featured.append(node);
    mount(node, <Equalizer />);
  }
  const podium = document.querySelectorAll<HTMLElement>(".hero-artist");
  if (!matchMedia("(prefers-reduced-motion:reduce)").matches)
    podium.forEach((el, i) =>
      animate(
        el,
        { opacity: [0, 1], y: [30, 0], scale: i === 0 ? [0.97, 1] : [1, 1] },
        { ...spring, delay: i === 0 ? 0.16 : (i - 1) * 0.08 },
      ),
    );
  const canvas = document.querySelector<HTMLCanvasElement>(
    "#music-receipt-canvas",
  );
  if (canvas) {
    const node = document.createElement("div");
    node.className = "afri-receipt-motion";
    canvas.after(node);
    mount(node, <ReceiptPrint canvas={canvas} />);
  }
  const heading = document.querySelector("h1");
  if (heading) {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT),
      texts: Text[] = [];
    while (walker.nextNode())
      if (walker.currentNode.textContent?.trim())
        texts.push(walker.currentNode as Text);
    texts.forEach((text) => {
      const host = document.createElement("b"),
        value = text.textContent ?? "";
      host.style.font="inherit";
      host.style.color="inherit";
      text.replaceWith(host);
      mount(host, <TextReveal text={value} />);
    });
  }
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
