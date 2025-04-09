/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../error.mjs";
import {
  EMPTY,
  compileGet,
  hasOwn,
  isTreeEmpty,
  map,
  mapIndex,
  recordTree,
  some,
} from "../../util/index.mjs";

/**
 * @type {<X>(
 *   value: X,
 * ) => X}
 */
const identity = (x) => x;

/**
 * @type {<X>(
 *   value: X,
 * ) => null}
 */
const returnNull = (_hash) => null;

/**
 * @type {(
 *   root: import("estree-sentry").Program<import("../hash.d.ts").HashProp>,
 * ) => import("./completion.d.ts").Completion}
 */
export const annotateCompletion = (root) =>
  recordTree(loopAll(root.body, true, {}).hashes, identity, returnNull);

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   nodes: import("./completion.d.ts").CompletionNode<import("../hash.d.ts").HashProp>[],
 *   maybe_last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion.d.ts").CompletionResult}
 */
const loopAll = (nodes, maybe_last, labels) => {
  let previous_maybe_last = maybe_last;
  /** @type {import("../../util/tree.d.ts").Tree<import("../hash.d.ts").Hash>} */
  const hashes = [];
  let { length } = hashes;
  for (let index = nodes.length - 1; index >= 0; index--) {
    const result = loop(nodes[index], previous_maybe_last, labels);
    previous_maybe_last = result.previous_maybe_last;
    hashes[length++] = result.hashes;
  }
  return { previous_maybe_last, hashes };
};
/* eslint-enable local/no-impure */

const getPreviousMaybeLast = compileGet("previous_maybe_last");

const getHashArray = compileGet("hashes");

/**
 * @type {(
 *   node: import("./completion.d.ts").CompletionNode<import("../hash.d.ts").HashProp>,
 *   maybe_last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion.d.ts").CompletionResult}
 */
const loop = (node, maybe_last, labels) => {
  if (node.type === "BlockStatement") {
    return loopAll(node.body, maybe_last, labels);
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    const result = loop(node.body, maybe_last, {
      ...labels,
      "": maybe_last,
    });
    return {
      previous_maybe_last: false,
      hashes: [
        maybe_last || result.previous_maybe_last
          ? [node._hash, node.body._hash]
          : EMPTY,
        result.hashes,
      ],
    };
  } else if (node.type === "SwitchStatement") {
    const next_label_record = { ...labels, "": maybe_last };
    const results = mapIndex(node.cases.length, (index) =>
      loop(node.cases[index], maybe_last, next_label_record),
    );
    return {
      previous_maybe_last: false,
      hashes: [
        maybe_last || some(results, getPreviousMaybeLast)
          ? [node._hash]
          : EMPTY,
        map(results, getHashArray),
      ],
    };
  } else if (node.type === "SwitchCase") {
    return loopAll(node.consequent, maybe_last, labels);
  } else if (node.type === "LabeledStatement") {
    return loop(node.body, maybe_last, {
      ...labels,
      [node.label.name]: maybe_last,
    });
  } else if (
    node.type === "EmptyStatement" ||
    node.type === "DebuggerStatement" ||
    node.type === "VariableDeclaration" ||
    node.type === "FunctionDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "ImportDeclaration" ||
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration" ||
    node.type === "ExportAllDeclaration"
  ) {
    return { previous_maybe_last: maybe_last, hashes: EMPTY };
  } else if (node.type === "IfStatement") {
    const result1 = loop(node.consequent, maybe_last, labels);
    const result2 = node.alternate
      ? loop(node.alternate, maybe_last, labels)
      : { previous_maybe_last: maybe_last, hashes: EMPTY };
    return {
      previous_maybe_last: false,
      hashes: [
        result1.previous_maybe_last || result2.previous_maybe_last
          ? [node._hash]
          : EMPTY,
        result1.hashes,
        result2.hashes,
      ],
    };
  } else if (node.type === "WithStatement") {
    const result = loop(node.body, maybe_last, labels);
    return {
      previous_maybe_last: false,
      hashes: [
        result.previous_maybe_last ? [node._hash] : EMPTY,
        loop(node.body, maybe_last, labels).hashes,
      ],
    };
  } else if (node.type === "TryStatement") {
    const result1 = loop(node.block, maybe_last, labels);
    const result2 =
      node.handler == null
        ? { previous_maybe_last: maybe_last, hashes: EMPTY }
        : loop(node.handler.body, maybe_last, labels);
    const result3 =
      node.finalizer == null
        ? { previous_maybe_last: maybe_last, hashes: EMPTY }
        : loop(node.finalizer, maybe_last, labels);
    return {
      previous_maybe_last: false,
      hashes: [
        result1.previous_maybe_last ? [node.block._hash] : EMPTY,
        result2.previous_maybe_last && node.handler != null
          ? [node.handler.body._hash]
          : EMPTY,
        // Mark finalizer that have completions so
        // that the trans path knows it must be
        // backed up and restored.
        (result3.previous_maybe_last || !isTreeEmpty(result3.hashes)) &&
        node.finalizer != null
          ? [node.finalizer._hash]
          : EMPTY,
        result1.hashes,
        result2.hashes,
        result3.hashes,
      ],
    };
  } else if (
    node.type === "ThrowStatement" ||
    node.type === "ReturnStatement"
  ) {
    return { previous_maybe_last: false, hashes: EMPTY };
  } else if (
    node.type === "BreakStatement" ||
    node.type === "ContinueStatement"
  ) {
    // Continue statements may mark the end of the program:
    //  do { 123; continue; } while (false)
    const label = node.label == null ? "" : node.label.name;
    if (hasOwn(labels, label)) {
      return {
        previous_maybe_last: labels[label],
        hashes: EMPTY,
      };
    } else {
      // This should be reported as an early syntax error later.
      return {
        previous_maybe_last: false,
        hashes: EMPTY,
      };
    }
  } else if (node.type === "ExpressionStatement") {
    return {
      previous_maybe_last: false,
      hashes: maybe_last ? node._hash : EMPTY,
    };
  } else {
    throw new AranTypeError(node);
  }
};
