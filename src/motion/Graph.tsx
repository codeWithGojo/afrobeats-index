import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { reveal } from "../../shared/motion/config";
type GraphNode = {
  id: string;
  name: string;
  type: "artist" | "producer";
  x: number;
  y: number;
  records: { source: string; title: string }[];
};
export function CollabGraph({
  artist,
  nodes,
}: {
  artist: { name: string };
  nodes: GraphNode[];
}) {
  const [hovered, setHovered] = useState("");
  const reduced = useReducedMotion(),
    select = (id: string) => {
      const input = document.getElementById(
        "graph-artist",
      ) as HTMLSelectElement | null;
      if (input) {
        input.value = id;
        input.dispatchEvent(new Event("change"));
      }
    };
  return (
    <motion.svg
      className="network"
      viewBox="0 0 900 660"
      role="img"
      aria-label={`${artist.name} collaboration network`}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reveal}
    >
      <title>{artist.name} credit network</title>
      {nodes.map((n) => (
        <motion.path
          key={"line-" + n.id}
          d={`M450 330L${n.x} ${n.y}`}
          fill="none"
          stroke="currentColor"
          opacity=".4"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{
            pathLength: !reduced && hovered === n.id ? [0, 1] : 1,
            opacity: hovered && hovered !== n.id ? 0.15 : 0.4,
          }}
          transition={{ ...reveal, delay: 0.05 }}
        />
      ))}
      <circle cx="450" cy="330" r="67" />
      <text x="450" y="335" textAnchor="middle">
        {artist.name}
      </text>
      {nodes.map((n, i) => (
        <motion.g
          key={n.id}
          onHoverStart={() => setHovered(n.id)}
          onHoverEnd={() => setHovered("")}
          animate={reduced ? undefined : { y: [0, -3, 0] }}
          transition={{
            duration: 3 + i * 0.13,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={reduced ? undefined : { scale: 1.03 }}
          style={{ transformOrigin: `${n.x}px ${n.y}px` }}
        >
          <a
            className={n.type}
            onFocus={() => setHovered(n.id)}
            onBlur={() => setHovered("")}
            href={
              n.type === "artist"
                ? "/collaborations?artist=" + n.id
                : n.records[0]?.source
            }
            onClick={
              n.type === "artist"
                ? (e) => {
                    e.preventDefault();
                    select(n.id);
                  }
                : undefined
            }
          >
            <circle cx={n.x} cy={n.y} r="43" />
            <text x={n.x} y={n.y + 4} textAnchor="middle">
              {n.name}
            </text>
          </a>
        </motion.g>
      ))}
    </motion.svg>
  );
}
