import {
  filterNarrow,
  isNotNull,
  listEntry,
  map,
  reduceEntry,
} from "../../util/index.mjs";
import { makeJsonExpression } from "./json.mjs";
import { makeWriteEffect } from "./node.mjs";

const { undefined } = globalThis;

/**
 * @type {(
 *   variable: import("./atom").ResVariable,
 *   initializer: Json,
 * ) => import("./binding").Binding}
 */
export const makeBinding = (variable, initializer) => [variable, initializer];

/**
 * @type {(
 *   binding: import("./binding").Binding,
 * ) => [
 *   import("./atom").ResVariable,
 *   aran.Intrinsic,
 * ]}
 */
const makeBindingHead = ([variable, _initializer]) => [variable, "undefined"];

/**
 * @type {(
 *   binding: import("./binding").Binding,
 * ) => import("./atom").ResEffect | null}
 */
const makeBindingBody = ([variable, initializer]) =>
  initializer === undefined
    ? null
    : makeWriteEffect(variable, makeJsonExpression(initializer));

/**
 * @type {(
 *   bindings: import("./binding").Binding[],
 * ) => {
 *   decl: [import("./atom").ResVariable, aran.Intrinsic][]
 *   init: import("./atom").ResEffect[]
 * }}
 */
export const setupBinding = (bindings) => {
  const unique = listEntry(reduceEntry(bindings));
  return {
    decl: map(unique, makeBindingHead),
    init: filterNarrow(map(unique, makeBindingBody), isNotNull),
  };
};
