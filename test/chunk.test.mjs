import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "../public/index.html"), "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error("could not find the inline <script> in index.html");

// Null-DOM: every access returns a callable, chainable proxy that absorbs
// gets/sets/calls, so the IIFE wiring (getElementById, classList.toggle,
// style.x =, addEventListener, appendChild, innerHTML =, etc.) runs silently.
function nullNode() {
  const fn = function () { return proxy; };
  const proxy = new Proxy(fn, {
    get(_t, k) {
      if (k === "value" || k === "textContent" || k === "placeholder") return "";
      if (k === "checked") return false;
      if (k === Symbol.toPrimitive) return () => "";
      return proxy;
    },
    set() { return true; },
    apply() { return proxy; },
  });
  return proxy;
}
const document = {
  getElementById: () => nullNode(),
  createElement: () => nullNode(),
  querySelectorAll: () => [],
  documentElement: nullNode(),
  body: nullNode(),
  addEventListener() {},
};
const store = (() => { const d = {}; return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: (k) => { delete d[k]; } }; })();
const sandbox = { document, localStorage: store, navigator: {}, setTimeout: () => 0, console, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: "index.html#inline" });
const C = sandbox.module.exports;

// The pure functions run inside a node:vm realm, so the arrays/objects they
// return carry the sandbox's Array/Object prototypes — which makes
// assert.deepStrictEqual reject them as "not reference-equal" even when the
// structure matches. Compare structurally (prototype-agnostic) by normalizing
// the vm value through the host JSON intrinsics first.
const eq = (actual, expected, msg) =>
  assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, msg);

// A complete opts object matching readOpts()'s shape, so the pure functions
// never read an undefined field. Individual tests override single fields.
function opts(over) {
  return Object.assign({
    mode: "script",
    prefix: "",
    sep: " ",
    maxLen: 400,
    maxSwitches: Infinity,
    lblfmt: "{name}:",
    countNarrator: false,
    repeatSpeaker: true,
    markCont: true,
    matchCase: false,
    wholeWord: true,
  }, over || {});
}

test("(1) the hook exposes the pure pipeline functions", () => {
  for (const name of ["splitSentences", "parseSegments", "expand", "pack", "wrapText", "countSwitches", "matchSpeaker"]) {
    assert.equal(typeof C[name], "function", name + " should be exported as a function");
  }
});

test("(2) splitSentences breaks on end-punctuation+space but keeps periods in URLs/decimals/times", () => {
  // Plain sentence split on ". " "! " "? ".
  eq(
    C.splitSentences("First sentence. Second one! And a third?"),
    ["First sentence.", "Second one!", "And a third?"]
  );
  // A URL's dots are not followed by a space, so they stay inside one sentence.
  eq(
    C.splitSentences("See https://example.com/a.b.c for details."),
    ["See https://example.com/a.b.c for details."]
  );
  // Decimal point: no space after the dot, so it is not a boundary.
  eq(
    C.splitSentences("Pi is about 3.14 today."),
    ["Pi is about 3.14 today."]
  );
  // Clock time: the colon is not end-punctuation and there is no ". ", so intact.
  eq(
    C.splitSentences("Meet at 9:30 sharp."),
    ["Meet at 9:30 sharp."]
  );
  // Trailing quote/bracket after the period still counts as a boundary.
  eq(
    C.splitSentences('She said "Go." Then she left.'),
    ['She said "Go."', "Then she left."]
  );
  // Empty / whitespace-only input yields no sentences.
  eq(C.splitSentences("   "), []);
});

test("(3) parseSegments maps NAME: lines to {speaker,text} and untagged lines to narrator", () => {
  const segs = C.parseSegments("ALICE: hi there\njust some prose\nBOB: a reply");
  eq(segs, [
    { speaker: "ALICE", text: "hi there" },
    { speaker: "narrator", text: "just some prose" },
    { speaker: "BOB", text: "a reply" },
  ]);
  // Blank lines are dropped.
  eq(
    C.parseSegments("\n  \nALICE: solo\n"),
    [{ speaker: "ALICE", text: "solo" }]
  );
});

test("(4) matchSpeaker rejects URLs and clock times but parses a real speaker line", () => {
  assert.equal(C.matchSpeaker("https://example.com"), null);
  assert.equal(C.matchSpeaker("9:30"), null);
  eq(C.matchSpeaker("ALICE: hi"), { speaker: "ALICE", text: "hi" });
  // A name made only of digits/punctuation has no letter, so it is not a speaker.
  assert.equal(C.matchSpeaker("123: nope"), null);
  // Colon ending the line (no dialogue yet) is still a valid speaker with empty text.
  eq(C.matchSpeaker("NARRATOR:"), { speaker: "NARRATOR", text: "" });
});

test("(5) countSwitches counts adjacent speaker changes", () => {
  assert.equal(C.countSwitches([]), 0);
  assert.equal(C.countSwitches(["a"]), 0);
  assert.equal(C.countSwitches(["a", "a", "a"]), 0);
  assert.equal(C.countSwitches(["a", "b"]), 1);
  assert.equal(C.countSwitches(["a", "b", "a"]), 2);
  assert.equal(C.countSwitches(["a", "a", "b", "b", "a"]), 2);
});

test("(6) wrapText word-wraps to a budget without exceeding it", () => {
  const budget = 10;
  const pieces = C.wrapText("one two three four five", budget);
  for (const p of pieces) {
    assert.ok(p.length <= budget, "piece \"" + p + "\" (" + p.length + ") exceeds budget " + budget);
  }
  // Reassembling the pieces with single spaces restores the original words.
  assert.equal(pieces.join(" "), "one two three four five");

  // A single word longer than the budget is allowed to overflow on its own line.
  const big = C.wrapText("supercalifragilistic word", 5);
  assert.equal(big[0], "supercalifragilistic");
  assert.ok(big[0].length > 5);

  // Empty input still yields a single (empty) piece.
  eq(C.wrapText("", 10), [""]);
});

test("(7) pack respects maxLen for normal input (driven through expand first)", () => {
  const o = opts({ maxLen: 40 });
  const segs = C.parseSegments(
    "ALICE: The quarterly report is finally finished and ready for your review today.\n" +
    "BOB: Great, send it over and I will read it before the meeting at the top of the hour.\n" +
    "ALICE: Will do."
  );
  const expanded = C.expand(segs, o);
  const splits = C.pack(expanded, o);
  assert.ok(splits.length > 1, "long input should produce multiple chunks");
  for (const s of splits) {
    assert.ok(s.text.length <= o.maxLen, "chunk \"" + s.text + "\" (" + s.text.length + ") exceeds maxLen " + o.maxLen);
  }
  // Each chunk reports its own switch count and speaker list.
  for (const s of splits) {
    assert.equal(typeof s.switches, "number");
    assert.ok(Array.isArray(s.speakers));
  }

  // Prose-style input through the same pipeline also stays within the cap.
  const o2 = opts({ mode: "prose", maxLen: 50, maxSwitches: Infinity });
  const proseSegs = C.splitSentences(
    "The workshop starts at 9:30 sharp. Please bring a laptop and its charger. " +
    "Details are posted online. Seating is limited so register in advance."
  ).map(function (t) { return { speaker: "narrator", text: t }; });
  const proseSplits = C.pack(C.expand(proseSegs, o2), o2);
  for (const s of proseSplits) {
    assert.ok(s.text.length <= o2.maxLen, "prose chunk too long: " + s.text.length);
  }
});

test("(8) applyReplacements honors whole-word and match-case via opts", () => {
  // Mutate the shared rules array in place (this is the exact array the module
  // closure reads inside applyReplacements).
  C.rules.length = 0;
  C.rules.push({ find: "cat", repl: "dog" });

  // Whole-word ON: "category" is untouched, the standalone word "cat" is replaced.
  assert.equal(
    C.applyReplacements("a cat in a category", opts({ wholeWord: true, matchCase: false })),
    "a dog in a category"
  );

  // Whole-word OFF: the substring inside "category" is replaced too.
  assert.equal(
    C.applyReplacements("a cat in a category", opts({ wholeWord: false, matchCase: false })),
    "a dog in a dogegory"
  );

  // Case-insensitive (default): "Cat" matches "cat".
  assert.equal(
    C.applyReplacements("Cat and cat", opts({ wholeWord: true, matchCase: false })),
    "dog and dog"
  );

  // Match-case ON: only the exact-case occurrence is replaced.
  assert.equal(
    C.applyReplacements("Cat and cat", opts({ wholeWord: true, matchCase: true })),
    "Cat and dog"
  );

  // Empty find rules are skipped (no throw, text unchanged).
  C.rules.length = 0;
  C.rules.push({ find: "", repl: "X" });
  assert.equal(C.applyReplacements("unchanged text", opts()), "unchanged text");

  // Restore a clean default rule so we don't leak state to other files/runs.
  C.rules.length = 0;
  C.rules.push({ find: "", repl: "" });
});
