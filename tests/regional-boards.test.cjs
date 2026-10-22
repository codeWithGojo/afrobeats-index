const { test } = require("node:test");
const assert = require("node:assert/strict");
const { definitions, rank } = require("../regional-boards.js");
const { artists } = require("../data/current.json");
test("regional boards preserve official ranks/scores and include explicit dual affiliations", () => {
  const before = JSON.stringify(artists);
  for (const board of definitions) {
    const list = rank(artists, board.id);
    list.forEach((artist, index) => {
      assert.equal(artist.boardRank, index + 1);
      assert.equal(artist.globalRank, artist.rank);
      assert.equal(
        artist.score,
        artists.find((source) => source.slug === artist.slug).score,
      );
      if (index) assert(list[index - 1].globalRank < artist.globalRank);
    });
  }
  assert.equal(JSON.stringify(artists), before);
  assert(
    rank(artists, "naija").some((artist) => artist.country === "UK / Nigeria"),
  );
  assert(
    rank(artists, "south-africa").some(
      (artist) => artist.country === "Eswatini / South Africa",
    ),
  );
  assert(
    rank(artists, "east-africa").every(
      (artist) => artist.country === "Tanzania",
    ),
  );
});
test("regional scope does not infer country from a genre or invent empty-board artists", () => {
  const sample = [
    {
      slug: "a",
      name: "A",
      rank: 4,
      score: 70,
      country: "Ghana",
      genres: ["Amapiano"],
    },
    { slug: "b", name: "B", rank: 2, score: 90, country: "UK / Nigeria" },
  ];
  assert.deepEqual(rank(sample, "south-africa"), []);
  assert.equal(rank(sample, "naija")[0].slug, "b");
  assert.throws(() => rank(sample, "unknown"), RangeError);
});

test('regional board routes expose the correct metadata and reject prototype names',async()=>{
 const view=require('../api/view.js');
 for(const board of definitions){let html='',status=200;const response={setHeader(){},status(value){status=value;return this;},send(value){html=value;return this;}};await view({query:{path:'boards/'+board.id}},response);assert.equal(status,200);assert(html.includes('<title>'+board.name+' · Afri Index</title>'));}
 let status=200;const response={setHeader(){},status(value){status=value;return this;},send(){return this;}};await view({query:{path:'boards/constructor'}},response);assert.equal(status,404);
});
