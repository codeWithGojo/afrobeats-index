import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const failures = [];
const requireText = (needle, label = needle) => {
  if (!html.includes(needle)) failures.push(`Missing ${label}`);
};

requireText('<link rel="canonical" href="https://afrobeats-index.vercel.app/">', "canonical URL");
requireText('content="https://afrobeats-index.vercel.app/og.jpg"', "social image URL");
requireText("AFRI_RANKING_UPGRADE_START", "embedded ranking engine");
requireText("How this score was built", "score ledger");
requireText("TurnTable certifications", "certification panel");
requireText("Platform stream mix", "stream platform panel");

for (const [index, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()) {
  try {
    new vm.Script(match[1], { filename: `inline-script-${index + 1}.js` });
  } catch (error) {
    failures.push(`Inline script ${index + 1} does not parse: ${error.message}`);
  }
}

const stateMatch = html.match(/<script>window\.AFRI_EMBEDDED_STATE=([\s\S]*?);<\/script>/);
const upgradeMatch = html.match(/<!-- AFRI_RANKING_UPGRADE_START -->\s*<script(?:\s[^>]*)?>([\s\S]*?)<\/script>\s*<!-- AFRI_RANKING_UPGRADE_END -->/);
if (!stateMatch || !upgradeMatch) {
  failures.push("Could not locate embedded state or ranking engine");
} else {
  const state = JSON.parse(stateMatch[1]);
  const context = { window: { AFRI_EMBEDDED_STATE: state, AFRI_CURRENT_ARTISTS: state.artists } };
  vm.createContext(context);
  vm.runInContext(upgradeMatch[1], context);
  const artists = context.window.AFRI_EMBEDDED_STATE.artists;
  if (artists.length !== 50) failures.push(`Expected 50 Current artists; found ${artists.length}`);
  if (artists[0]?.name !== "Burna Boy" || artists[0]?.score !== 97.1) {
    failures.push(`Unexpected Current leader: ${artists[0]?.name} ${artists[0]?.score}`);
  }
  const ranks = artists.map((artist) => artist.rank);
  if (new Set(ranks).size !== artists.length || Math.min(...ranks) !== 1 || Math.max(...ranks) !== 50) {
    failures.push("Current ranks are not a complete unique 1–50 sequence");
  }
  const scoring = context.window.AFRI_EMBEDDED_STATE.scoring;
  const topLevelWeight = Object.values(scoring.currentWeights).reduce((sum, value) => sum + value, 0);
  if (topLevelWeight !== 100) failures.push(`Current weights total ${topLevelWeight}, not 100`);
  if (JSON.stringify(scoring.streamPlatformWeights) !== JSON.stringify({ spotify: 0.45, boomplay: 0.3, youtube: 0.25 })) {
    failures.push("Stream platform weights differ from 45/30/25");
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("AFR/INDEX verification passed: metadata, scripts, 50 ranks, weights, and leader are consistent.");
