const { test } = require("node:test");
const assert = require("node:assert/strict");
const { compactParts } = require("../current-view.js");
test("mobile chart counters use compact units for daily and catalogue streams", () => {
  assert.deepEqual(compactParts(593418), {
    value: 593.418,
    digits: 1,
    suffix: "K",
  });
  assert.deepEqual(compactParts(925900000), {
    value: 925.9,
    digits: 1,
    suffix: "M",
  });
  assert.deepEqual(compactParts(1190000000), {
    value: 1.19,
    digits: 2,
    suffix: "B",
  });
  assert.deepEqual(compactParts(0), { value: 0, digits: 0, suffix: "" });
  assert.equal(compactParts(NaN), null);
  assert.equal(compactParts(Infinity), null);
});
