// Validate first, then publish reviewed records with an explicitly supplied service key.
const fs = require("node:fs");
const { data } = require("../lib/shared.cjs");
const { validateSignals } = require("../lib/signal-validation.cjs");
const { rest } = require("../lib/product-server.cjs");
(async () => {
  const file = process.argv[2];
  if (!file)
    throw Error(
      "Usage: node scripts/import-signals.cjs observations.json [--publish]",
    );
  const rows = validateSignals(
    JSON.parse(fs.readFileSync(file, "utf8")),
    data.artists,
  );
  console.log(
    `${rows.length} valid observations; ${rows.filter((r) => r.reviewed).length} reviewed.`,
  );
  if (process.argv.includes("--publish")) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw Error("Set SUPABASE_SERVICE_ROLE_KEY in the server environment");
    await rest("signal_observations", {
      method: "POST",
      admin: true,
      body: rows,
      headers: { Prefer: "resolution=ignore-duplicates" },
    });
    console.log(
      "Source observations imported. Official Current weights were not changed.",
    );
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
