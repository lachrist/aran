/* eslint-disable local/no-jsdoc-typedef */

import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";

/**
 * @typedef {`hash:${string}`} Hash
 * @typedef {`${import("aran").FlexibleAspectKind}:${Hash}`} Point
 * @typedef {`dynamic://eval/local/${Hash}`} LocalEvalPath
 * @typedef {(
 *   | import("../../fetch").HarnessName
 *   | import("../../fetch").DependencyPath
 *   | import("../../fetch").TestPath
 *   | LocalEvalPath
 * )} FilePath
 * @typedef {string & {__brand: "GlobalVariable"}} GlobalVariable
 * @typedef {string & {__brand: "Variable"}} Variable
 * @typedef {string & {__brand: "Label"}} Label
 * @typedef {string & {__brand: "Specifier"}} Specifier
 * @typedef {string & {__brand: "Source"}} Source
 * @typedef {{
 *   Variable: Variable,
 *   Label: Label,
 *   Specifier: Specifier,
 *   Source: Source,
 *   Tag: Hash,
 * }} Atom
 * @typedef {unknown & {__brand: "Value"}} Value
 * @typedef {"@state"} State
 */
/**
 * @type {import("aran").Digest<Hash>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  `hash:${file_path}:${node_path}`;

/**
 * @type {(hash: Hash) => FilePath}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

const { setup, trans, retro } = compileAran(
  {
    mode: "normal",
    escape_prefix: "__aran__",
    global_object_variable: "globalThis",
    intrinsic_global_variable: "__intrinsic__",
    global_declarative_record: "builtin",
    digest,
  },
  toEvalPath,
);

/**
 * @type {(
 *   kind: import("aran").FlexibleAspectKind,
 * ) => GlobalVariable}
 */
const toGlobalVariable = (kind) => {};

/**
 * @type {() => import("aran").HomogeneousFlexibleAdvice<Atom, State, >}
 */
const compileAspect = ({}) => ({});

/**
 * @type {import("aran").FlexibleWeaveConfig}
 */
const conf = {
  initial_state: null,
  pointcut: {
    "block@setup": () => {},
    "block@before": () => {},
    "block@declaration": () => {},
    "block@declaration-overwrite": () => {},
    "program-block@after": () => {},
    "closure-block@after": () => {},
    "segment-block@after": () => {},
    "block@throwing": () => {},
    "block@teardown": () => {},
    "statement@before": () => {},
    "statement@after": () => {},
    "effect@before": () => {},
    "effect@after": () => {},
    "expression@before": () => {},
    "expression@after": () => {},
    "eval@before": () => {},
    "apply@around": () => {},
    "construct@around": () => {},
  },
};

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["bare-main"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup,
  instrument: ({ type, kind, path, content }) => ({
    path,
    content:
      type === "main"
        ? retro(weaveFlexible(trans(path, kind, content), conf))
        : content,
  }),
};
