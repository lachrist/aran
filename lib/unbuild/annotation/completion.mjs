/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../report.mjs";
import {
  EMPTY,
  EMPTY_TREE,
  compileGet,
  enumerateReverse,
  hasOwn,
  listTreeLeaf,
  map,
  mapIndex,
  reduce,
  reduceEntry,
  some,
} from "../../util/index.mjs";

/**
 * @type {<X>(
 *   first: X,
 * ) => [X, null]}
 */
const pairupNull = (first) => [first, null];

/**
 * @type {(
 *   root: import("../../estree").Program,
 *   digest: import("../../hash").Digest,
 * ) => import("./completion").Completion}
 */
export const annotateCompletion = (root, digest) =>
  reduceEntry(
    map(listTreeLeaf(loopAll(root.body, digest, true, {}).hashes), pairupNull),
  );

/**
 * @type {(
 *   nodes: import("./completion").CompletionNode[],
 *   digest: import("../../hash").Digest,
 *   maybe_last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion").CompletionResult}
 */
const loopAll = (nodes, digest, maybe_last, labels) =>
  reduce(
    enumerateReverse(nodes.length),
    (result1, index) => {
      const result2 = loop(
        nodes[index],
        digest,
        result1.previous_maybe_last,
        labels,
      );
      return {
        previous_maybe_last: result2.previous_maybe_last,
        hashes: ["tt", result1.hashes, result2.hashes],
      };
    },
    /** @type {import("./completion").CompletionResult} */ ({
      previous_maybe_last: maybe_last,
      hashes: EMPTY_TREE,
    }),
  );

const getPreviousMaybeLast = compileGet("previous_maybe_last");

const getHashArray = compileGet("hashes");

/**
 * @type {(
 *   node: import("./completion").CompletionNode,
 *   digest: import("../../hash").Digest,
 *   maybe_last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion").CompletionResult}
 */
const loop = (node, digest, maybe_last, labels) => {
  if (node.type === "BlockStatement") {
    return loopAll(node.body, digest, maybe_last, labels);
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    const result = loop(node.body, digest, maybe_last, {
      ...labels,
      "": maybe_last,
    });
    return {
      previous_maybe_last: false,
      hashes: [
        "Xt",
        maybe_last || result.previous_maybe_last
          ? [digest(node), digest(node.body)]
          : EMPTY,
        result.hashes,
      ],
    };
  } else if (node.type === "SwitchStatement") {
    const next_label_record = { ...labels, "": maybe_last };
    const results = mapIndex(node.cases.length, (index) =>
      loop(node.cases[index], digest, maybe_last, next_label_record),
    );
    return {
      previous_maybe_last: false,
      hashes: [
        "XT",
        maybe_last || some(results, getPreviousMaybeLast)
          ? [digest(node)]
          : EMPTY,
        map(results, getHashArray),
      ],
    };
  } else if (node.type === "SwitchCase") {
    return loopAll(node.consequent, digest, maybe_last, labels);
  } else if (node.type === "LabeledStatement") {
    return loop(node.body, digest, maybe_last, {
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
    return { previous_maybe_last: maybe_last, hashes: EMPTY_TREE };
  } else if (node.type === "IfStatement") {
    const result1 = loop(node.consequent, digest, maybe_last, labels);
    const result2 = node.alternate
      ? loop(node.alternate, digest, maybe_last, labels)
      : { previous_maybe_last: maybe_last, hashes: EMPTY_TREE };
    return {
      previous_maybe_last: false,
      hashes: [
        "Xtt",
        result1.previous_maybe_last || result2.previous_maybe_last
          ? [digest(node)]
          : EMPTY,
        result1.hashes,
        result2.hashes,
      ],
    };
  } else if (node.type === "WithStatement") {
    const result = loop(node.body, digest, maybe_last, labels);
    return {
      previous_maybe_last: false,
      hashes: [
        "Xt",
        result.previous_maybe_last ? [digest(node)] : EMPTY,
        loop(node.body, digest, maybe_last, labels).hashes,
      ],
    };
  } else if (node.type === "TryStatement") {
    const result1 = loop(node.block, digest, maybe_last, labels);
    const result2 =
      node.handler == null
        ? { previous_maybe_last: maybe_last, hashes: EMPTY_TREE }
        : loop(node.handler.body, digest, maybe_last, labels);
    const result3 =
      node.finalizer == null
        ? { previous_maybe_last: maybe_last, hashes: EMPTY_TREE }
        : loop(node.finalizer, digest, maybe_last, labels);
    return {
      previous_maybe_last: false,
      hashes: [
        "XXXttt",
        result1.previous_maybe_last ? [digest(node.block)] : EMPTY,
        result2.previous_maybe_last && node.handler != null
          ? [digest(node.handler.body)]
          : EMPTY,
        // Mark finalizer that have completions so
        // that the unbuild path knows it must be
        // backed up and restored.
        (result3.previous_maybe_last || result3.hashes.length > 0) &&
        node.finalizer != null
          ? [digest(node.finalizer)]
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
    return { previous_maybe_last: false, hashes: EMPTY_TREE };
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
        hashes: EMPTY_TREE,
      };
    } else {
      // This should be reported as an early syntax error later.
      return {
        previous_maybe_last: false,
        hashes: EMPTY_TREE,
      };
    }
  } else if (node.type === "ExpressionStatement") {
    return {
      previous_maybe_last: false,
      hashes: maybe_last ? ["x", digest(node)] : EMPTY_TREE,
    };
  } else {
    throw new AranTypeError(node);
  }
};
