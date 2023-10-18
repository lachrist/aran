import { map } from "../util/index.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

/**
 * @type {(
 *   variable: estree.Variable,
 *   options: {
 *     intrinsic: estree.Variable,
 *     advice: estree.Variable,
 *     escape: estree.Variable,
 *   },
 * ) => string[]}
 */
const listClashMessage = (variable, { intrinsic, advice, escape }) => [
  ...(variable === intrinsic
    ? [`external variable clashes with intrinsic name: ${variable}`]
    : []),
  ...(variable === advice
    ? [`external variable clashes with advice name: ${variable}`]
    : []),
  ...(apply(startsWith, variable, [escape])
    ? [`external variable clashes with escape prefix: ${variable}`]
    : []),
];

/**
 * @type {(message: string) => rebuild.Log}
 */
const logClash = (message) => ({
  name: "ClashError",
  message,
});

/**
 * @type {(
 *   variable: estree.Variable,
 *   options: {
 *     intrinsic: estree.Variable,
 *     advice: estree.Variable,
 *     escape: estree.Variable,
 *   },
 * ) => rebuild.Log[]}
 */
export const listClash = (variable, options) =>
  map(listClashMessage(variable, options), logClash);
