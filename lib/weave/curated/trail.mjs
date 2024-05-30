import { AranTypeError } from "../../error.mjs";

/**
 * @type {{[key in aran.NodeKey]: string}}
 */
const shortcut = {
  alternate: "al",
  arguments: "ar",
  asynchronous: "as",
  body: "bo",
  callee: "cl",
  catch: "ct",
  code: "co",
  completion: "cp",
  consequent: "cs",
  delegate: "de",
  discard: "di",
  else: "el",
  export: "ex",
  finally: "fi",
  frame: "fr",
  generator: "ge",
  head: "he",
  import: "im",
  inner: "in",
  intrinsic: "ic",
  item: "it",
  kind: "ki",
  label: "lb",
  labels: "ls",
  negative: "ng",
  positive: "ps",
  primitive: "pr",
  promise: "po",
  result: "re",
  situ: "si",
  source: "sc",
  tag: "tg",
  tail: "tl",
  test: "tt",
  then: "tn",
  this: "ts",
  try: "tr",
  type: "ty",
  value: "vl",
  variable: "vr",
};

export const ROOT_TRAIL = /** @type {import("./trail").Trail} */ ("");

/**
 * @type {(
 *   trail: import("./trail").Trail,
 *   key: import("../../../type/aran").NodeKey | number,
 * ) => import("./trail").Trail}
 */
export const joinTrail = (trail, key) => {
  if (typeof key === "number") {
    return /** @type {import("./trail").Trail} */ (
      `${trail}${key > 9 ? `$${key}` : key}`
    );
  } else if (typeof key === "string") {
    return /** @type {import("./trail").Trail} */ (`${trail}${shortcut[key]}`);
  } else {
    throw new AranTypeError(key);
  }
};
