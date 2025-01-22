/* eslint-disable local/no-jsdoc-typedef */

import { weaveFlexible } from "aran";
import { compileAran } from "../aran.mjs";
import { AranTestError } from "../../error.mjs";

const {
  Object: { hasOwn },
} = globalThis;

/**
 * @typedef {`hash:${string}`} Hash
 * @typedef {[import("aran").FlexibleAspectKind, Hash]} Point
 * @typedef {`dynamic://eval/local/${Hash}`} LocalEvalPath
 * @typedef {(
 *   | import("../../fetch").HarnessName
 *   | import("../../fetch").DependencyPath
 *   | import("../../fetch").TestPath
 *   | LocalEvalPath
 * )} FilePath
 * @typedef {string & {__brand: "JavaScriptIdentifier"}} JavaScriptIdentifier
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


////////////
// Assert //
////////////

/**
 * @type {(
*   check: boolean
* ) => asserts check}
*/
const assert = (value) => {
 if (!value) {
   throw new AranTestError("assertion failure");
 }
};

/**
* @type {(
*   node: import("aran").Node,
* ) => void}
*/
const assertNode = (node) => {
 assert(
   typeof node === "object" &&
     node !== null &&
     hasOwn(node, "type") &&
     typeof node.type === "string",
 );
};

/**
* @type {(
  *   node: import("aran").Node,
  * ) => void}
  */
const assertHash = (hash) => {
  assert(typeof hash === "string" && hash.startsWith("hash:"));
}

/**
 * @type {(
*   input: any[],
*   asserts: ((arg: any) => void)[],
* ) => void}
*/
const assertInput = (input, assertions) => {
 assert(input.length === assertions.length);
 const { length } = input;
 for (let index = 0; index < length; index++) {
   assertions[index](input[index]);
 }
};

/**
* @type {<X1, X2, X3>(
*   input: [X1, X2, X3],
*   assertions: [
*     (arg: X1) => void,
*     (arg: X2) => void,
*     (arg: X3) => void,
*   ],
* ) => void}
*/
const assertInput3 = assertInput;

/**
* @type {<X1, X2, X3, X4>(
*   input: [X1, X2, X3, X4],
*   assertions: [
*     (arg: X1) => void,
*     (arg: X2) => void,
*     (arg: X3) => void,
*     (arg: X4) => void,
*   ],
* ) => void}
*/
const assertInput4 = assertInput;

/**
* @type {<X1, X2, X3, X4, X5>(
*   input: [X1, X2, X3, X4, X5],
*   assertions: [
*     (arg: X1) => void,
*     (arg: X2) => void,
*     (arg: X3) => void,
*     (arg: X4) => void,
*     (arg: X5) => void
*   ],
* ) => void}
*/
const assertInput5 = assertInput;


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
 * ) => JavaScriptIdentifier}
 */
const toGlobalVariable = (kind) =>
  /** @type {JavaScriptIdentifier} */ (
    `aran_${kind.replaceAll("@", "_").replaceAll("-", "_")}`
  );



/**
 * @type
*/
const assertInput

/**
 * @type {(
 *   kind: import("aran").FlexibleAspectKind,
 * ) => (
 *   node: import("aran").Node<Atom>,
 *   parent: import("aran").Node<Atom>,
 *   root: import("aran").Node<Atom>,
 * ) => Point}
 */
const compilePointcut = (kind) => (node, parent, root) => {
  assertNode(node);
  assertNode(parent);
  assertNode(root);
  assert(root.type === "Program");
  return [kind, node.tag];
};

/**
 * @type {() => import("aran").FlexibleAspect<Atom, State, Value, Point, JavaScriptIdentifier>}
 */
const compileAspect = ({}) => ({
  [toGlobalVariable("block@setup")]: {
    kind: "block@setup",
    pointcut: compilePointcut("block@setup"),
    advice: (...input) => {
      assert(input.length)
      return STATE;
    },
  },
});

// /**
//  * @type {import("aran").FlexibleWeaveConfig}
//  */
// const conf = {
//   initial_state: null,
//   pointcut: {
//     "block@setup": () => {},
//     "block@before": () => {},
//     "block@declaration": () => {},
//     "block@declaration-overwrite": () => {},
//     "program-block@after": () => {},
//     "closure-block@after": () => {},
//     "segment-block@after": () => {},
//     "block@throwing": () => {},
//     "block@teardown": () => {},
//     "statement@before": () => {},
//     "statement@after": () => {},
//     "effect@before": () => {},
//     "effect@after": () => {},
//     "expression@before": () => {},
//     "expression@after": () => {},
//     "eval@before": () => {},
//     "apply@around": () => {},
//     "construct@around": () => {},
//   },
// };

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
