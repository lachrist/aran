import { readFile } from "node:fs/promises";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { parseList } from "../list.mjs";

const { URL, Set } = globalThis;

const features = new Set(
  parseList(
    await readFile(new URL("identity.feature.txt", import.meta.url), "utf8"),
  ),
);

const exclusion = new Set(
  parseList(
    await readFile(new URL("identity.exclude.txt", import.meta.url), "utf8"),
  ),
);

/** @type {(feature: string) => boolean} */
const isFeatureExcluded = (feature) => features.has(feature);

const negative = parseNegative(
  await readFile(new URL("identity.negative.txt", import.meta.url), "utf8"),
);

/** @type {import("../types").Stage} */
export default (_argv) => ({
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (target) => getNegativeStatus(negative, target),
  listCause: (result) => [
    ...result.metadata.features.filter(isFeatureExcluded),
    ...listNegativeCause(negative, result.target),
  ],
  compileInstrument: ({ record }) => record,
});
