import { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  LayoutGroup,
} from "motion/react";
import { spring, reveal, list, item } from "../../shared/motion/config";
import { CountUp, StatBar } from "../../shared/motion/primitives";
type Artist = {
  slug: string;
  name: string;
  rank: number;
  previousRank: number;
  country: string;
  image: string;
  imageFallback?: string;
  bio: string;
  genres: string[];
  score: number;
  dailySpotifyStreams: number;
  trackedAudioStreams?: number;
  totalSpotifyStreams: number;
};
export function RisingBadge() {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="afri-fire"
      aria-label="Rising artist"
      animate={reduced ? { scale: 1 } : { scale: [1, 1.15, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    >
      🔥
    </motion.span>
  );
}
export function Ranking({ artists: initialArtists }: { artists: Artist[] }) {
  const [artists, setArtists] = useState(() =>
    initialArtists.map((a) => ({ ...a })),
  );
  useEffect(() => {
    const update = (event: Event) =>
      setArtists(
        (event as CustomEvent<Artist[]>).detail.map((a) => ({ ...a })),
      );
    window.addEventListener("afri:artists-updated", update);
    return () => window.removeEventListener("afri:artists-updated", update);
  }, []);
  const reduced = useReducedMotion(),
    [query, setQuery] = useState(""),
    [country, setCountry] = useState("");
  useEffect(() => {
    const search = document.querySelector<HTMLInputElement>("#chart-search"),
      select = document.querySelector<HTMLSelectElement>("#chart-country");
    const sync = () => {
      setQuery(search?.value.toLowerCase().trim() ?? "");
      setCountry(select?.value ?? "");
    };
    search?.addEventListener("input", sync);
    select?.addEventListener("change", sync);
    const reset = document.getElementById("chart-reset");
    reset?.addEventListener("click", sync);
    return () => {
      search?.removeEventListener("input", sync);
      select?.removeEventListener("change", sync);
      reset?.removeEventListener("click", sync);
    };
  }, []);
  const filtered = artists.filter(
    (a) =>
      (!country || country === a.country) &&
      (!query ||
        [a.name, a.bio, a.country, ...a.genres]
          .join(" ")
          .toLowerCase()
          .includes(query)),
  );
  useEffect(() => {
    const count = document.getElementById("chart-count"),
      empty = document.querySelector<HTMLElement>(".chart-empty");
    if (count)
      count.textContent =
        filtered.length === artists.length
          ? `Showing all ${artists.length} artists`
          : `${filtered.length} of ${artists.length} artists · official ranks retained`;
    if (empty) empty.hidden = filtered.length > 0;
  }, [filtered.length, artists.length]);
  return (
    <LayoutGroup id="current-ranking">
      <motion.div
        style={{ display: "contents" }}
        initial={reduced ? false : "hidden"}
        animate="visible"
        variants={list}
      >
        <AnimatePresence initial={false}>
          {filtered.map((a) => {
            const delta = a.previousRank - a.rank;
            return (
              <motion.a
                key={a.slug}
                layout={!reduced}
                data-motion-owned
                className="current-row"
                href={`/current/${a.slug}`}
                data-name={a.name}
                data-rank={a.rank}
                data-artist-slug={a.slug}
                data-country={a.country}
                aria-label={`Open ${a.name} artist file`}
                variants={reduced ? {} : item}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={spring}
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
              >
                <span className="current-rank">
                  {String(a.rank).padStart(2, "0")}
                </span>
                <span className="current-avatar">
                  <img
                    src={a.image}
                    alt=""
                    width="64"
                    height="64"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (a.imageFallback && !e.currentTarget.dataset.tried) {
                        e.currentTarget.dataset.tried = "true";
                        e.currentTarget.src = a.imageFallback;
                      }
                    }}
                  />
                </span>
                <span className="current-identity">
                  <span className="current-kicker">{a.country}</span>
                  <span className="current-name-line">
                    <span className="current-name">{a.name}</span>
                    <motion.span
                      key={delta}
                      className={`movement movement-${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}
                      initial={
                        reduced ? false : { opacity: 0, y: delta > 0 ? 8 : -8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={spring}
                      aria-label={
                        delta
                          ? `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} from #${a.previousRank}`
                          : "No movement"
                      }
                    >
                      {delta > 0
                        ? "↑ " + delta
                        : delta < 0
                          ? "↓ " + Math.abs(delta)
                          : "—"}
                    </motion.span>
                    {delta >= 5 && <RisingBadge />}
                  </span>
                  <span className="current-blurb">{a.bio}</span>
                  <span className="current-tags">
                    {a.genres.map((g) => (
                      <span key={g}>{g}</span>
                    ))}
                  </span>
                </span>
                <span className="current-streams">
                  <span>
                    <small>Daily Spotify</small>
                    <strong>
                      <Compact value={a.dailySpotifyStreams} />
                    </strong>
                  </span>
                  <span>
                    <small>Tracked Spotify total</small>
                    <strong>
                      <Compact
                        value={a.trackedAudioStreams ?? a.totalSpotifyStreams}
                      />
                    </strong>
                  </span>
                </span>
                <span className="current-score">
                  <small>Index score</small>
                  <strong>
                    <CountUp value={a.score} digits={1} />
                  </strong>
                  <i>
                    <StatBar value={a.score} />
                  </i>
                </span>
                <span className="current-open" aria-hidden="true">
                  ↗
                </span>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
function Compact({ value }: { value: number }) {
  const billion = value >= 1e9,
    million = value >= 1e6,
    divisor = billion ? 1e9 : million ? 1e6 : 1;
  return (
    <CountUp
      value={value / divisor}
      digits={billion ? 2 : 1}
      suffix={billion ? "B" : million ? "M" : ""}
    />
  );
}
export type HtmlRow = {
  key: string;
  tag: string;
  html: string;
  attrs: Record<string, string>;
};
export function HtmlRanking({ rows }: { rows: HtmlRow[] }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      style={{ display: "contents" }}
      variants={list}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          const Tag = row.tag === "a" ? motion.a : motion.div;
          return (
            <Tag
              {...row.attrs}
              key={row.key}
              layout={!reduced}
              data-motion-owned
              variants={reduced ? {} : item}
              initial={reduced ? false : "hidden"}
              animate="visible"
              exit={reduced ? undefined : { opacity: 0 }}
              transition={spring}
              whileHover={reduced ? undefined : { scale: 1.01 }}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              dangerouslySetInnerHTML={{ __html: row.html }}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
export function ArtistCompare({ artists }: { artists: Artist[] }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={artists.map((a) => a.slug).join("-")}
        style={{ display: "contents" }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reveal}
      >
        {artists.map((a, i) => (
          <motion.section
            key={a.slug}
            className="panel"
            initial={reduced ? false : { x: i === 0 ? -24 : 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...reveal, delay: i * 0.05 }}
          >
            <h2>
              <a href={`/current/${a.slug}`}>{a.name}</a>
            </h2>
            <p>
              #{a.rank} Current · Score <CountUp value={a.score} digits={1} />
            </p>
            <div className="afri-compare-track">
              <StatBar value={a.score} delay={i * 0.1} />
            </div>
            <p>
              <CountUp value={a.dailySpotifyStreams} /> daily Spotify streams
            </p>
            <p>
              <CountUp value={a.trackedAudioStreams ?? a.totalSpotifyStreams} />{" "}
              tracked audio streams
            </p>
          </motion.section>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
