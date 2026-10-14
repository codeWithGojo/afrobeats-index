(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfriQuizSession = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function seeded(seed) {
    let state = 2166136261;
    for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return function () {
      state += 0x6D2B79F5;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, rng) {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function selectSession(questions, level, seed, count = 10) {
    const rng = seeded(seed);
    let eligible = questions.filter((q) => level === 'casual' ? q.difficulty === 'easy' : level === 'superfan' ? q.difficulty === 'hard' : true);
    if (eligible.length < count) eligible = questions;
    const categories = shuffle([...new Set(eligible.map((q) => q.category))], rng);
    const buckets = new Map(categories.map((category) => [category, shuffle(eligible.filter((q) => q.category === category), rng)]));
    const selected = [], usedRecords = new Set();
    while (selected.length < count && [...buckets.values()].some((items) => items.length)) {
      for (const category of categories) {
        if (selected.length >= count) break;
        const bucket = buckets.get(category);
        if (!bucket.length) continue;
        let index = bucket.findIndex((q) => q.sources.every((source) => !usedRecords.has(source.recordId)));
        if (index < 0) index = 0;
        const question = bucket.splice(index, 1)[0];
        question.sources.forEach((source) => usedRecords.add(source.recordId));
        const indices = shuffle(question.options.map((_, index) => index), rng);
        selected.push({ ...question, options: indices.map((index) => question.options[index]), answerIndex: indices.indexOf(question.answerIndex) });
      }
    }
    return shuffle(selected, rng);
  }
  return { selectSession };
});
