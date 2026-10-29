/* Test the REAL site.js — not a copy of it — for the one thing the compatibility list needs from a
 * script: that it opens where it was left, and records where it is left.
 *
 *     node tools/test-compat.mjs
 *
 * The element itself is a native <details>, so the opening and closing is the browser's work and
 * needs no test; what is tested here is the memory. The store is the one the cookie panel uses —
 * localStorage — because this site sets no cookies, and two of the cases are the ones a browser
 * check cannot reach without a real visitor: private mode, where storage throws, and first visit,
 * where there is nothing stored and the list must stay as authored (collapsed).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, "..", "site", "site.js"), "utf8");

let failures = 0;
const check = (name, ok) => {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

function run({ stored, box = true, throwOnRead = false, throwOnWrite = false } = {}) {
  const store = new Map(stored === undefined ? [] : [["fmradio.compat", stored]]);
  const listeners = {};
  const node = {
    open: false,
    addEventListener(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    fire(type) {
      (listeners[type] || []).forEach((fn) => fn());
    },
  };
  const localStorage = {
    getItem(k) {
      if (throwOnRead) throw new Error("SecurityError");
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      if (throwOnWrite) throw new Error("QuotaExceededError");
      store.set(k, String(v));
    },
    removeItem(k) {
      store.delete(k);
    },
  };
  const document = {
    querySelector(sel) {
      return box && sel === "[data-compat]" ? node : null;
    },
    addEventListener() {},
    body: { appendChild() {} },
  };
  vm.runInNewContext(code, { document, localStorage, navigator: {}, setTimeout, console });
  return { node, store };
}

console.log("site.js — the real file, in a stub DOM\n");

let r = run();
check("first visit (nothing stored) → the list stays as authored, collapsed", r.node.open === false);

r = run({ stored: "open" });
check("stored 'open' → the list is open", r.node.open === true);

r = run({ stored: "closed" });
check("stored 'closed' → the list is closed", r.node.open === false);

r = run({ stored: "open" });
r.node.open = false;
r.node.fire("toggle");
check("closed by the visitor → 'closed' is stored", r.store.get("fmradio.compat") === "closed");

r = run({ stored: "closed" });
r.node.open = true;
r.node.fire("toggle");
check("opened by the visitor → 'open' is stored", r.store.get("fmradio.compat") === "open");

r = run({ stored: "open", throwOnRead: true, throwOnWrite: true });
check("private mode (storage throws) → the script does not break", r.node.open === false);
r.node.fire("toggle");
check("private mode (storage throws) → the toggle still fires without an error", true);

r = run({ box: false });
check("no compatibility list on the page → the script does nothing", true);

if (failures) {
  console.log(`\n  ${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\n  TEST OK — the list remembers its state, and forgets safely");
