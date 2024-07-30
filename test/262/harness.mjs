import { readFile } from "node:fs/promises";

const { WeakMap, Map, undefined } = globalThis;

/**
 * @type {WeakMap<
 *   import("./stage").Instrument,
 *   Map<string, import("./stage").Source>
 * >}
 */
const cache = new WeakMap();

/**
 * @type {(
 *   instrument: import("./stage").Instrument,
 *   map: Map<string, import("./stage").Source>,
 *   url: URL,
 * ) => Promise<import("./stage").Source>}
 */
const fetchHarnessInner = async (instrument, map, url) => {
  const harness = map.get(url.href);
  if (harness === undefined) {
    const harness = instrument({
      kind: "script",
      url,
      content: await readFile(url, "utf8"),
    });
    map.set(url.href, harness);
    return harness;
  } else {
    return harness;
  }
};

/**
 * @type {(
 *   instrument: import("./stage").Instrument,
 *   url: URL,
 * ) => Promise<import("./stage").Source>}
 */
export const fetchHarness = (instrument, url) => {
  const map = cache.get(instrument);
  if (map === undefined) {
    const map = new Map();
    cache.set(instrument, map);
    return fetchHarnessInner(instrument, map, url);
  } else {
    return fetchHarnessInner(instrument, map, url);
  }
};
