/* Shared browser/server scope for country-affiliation sub-boards. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfriRegionalBoards = factory();
})(typeof window === "undefined" ? globalThis : window, function () {
  const definitions = [
    {
      id: "naija",
      name: "Naija",
      countries: ["Nigeria"],
      description:
        "Nigerian artists in the published Current 50, including recorded dual affiliations.",
    },
    {
      id: "ghana",
      name: "Ghana",
      countries: ["Ghana"],
      description: "Ghanaian artists in the published Current 50.",
    },
    {
      id: "south-africa",
      name: "South Africa",
      countries: ["South Africa"],
      description:
        "South African artists in the published Current 50, across Amapiano and other genres.",
    },
    {
      id: "east-africa",
      name: "East Africa",
      countries: [
        "Tanzania",
        "Kenya",
        "Uganda",
        "Ethiopia",
        "Rwanda",
        "Burundi",
        "Somalia",
        "Eritrea",
        "Djibouti",
        "South Sudan",
      ],
      description:
        "East African artists represented in the published Current 50.",
    },
  ];
  function rank(artists, id) {
    const definition = definitions.find((board) => board.id === id);
    if (!definition) throw new RangeError("Unknown regional board");
    const countries = new Set(
      definition.countries.map((country) => country.toLowerCase()),
    );
    return artists
      .filter(
        (artist) =>
          Number.isFinite(artist.rank) &&
          Number.isFinite(artist.score) &&
          String(artist.country || "")
            .split(/\s*(?:\/|,|&)\s*/)
            .some((country) => countries.has(country.trim().toLowerCase())),
      )
      .sort((a, b) => a.rank - b.rank)
      .map((artist, index) => ({
        ...artist,
        globalRank: artist.rank,
        boardRank: index + 1,
      }));
  }
  return { definitions, rank };
});
