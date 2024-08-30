/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../report.mjs";
import { joinDeepPath, joinPath } from "../../path.mjs";
import {
  EMPTY,
  compileGet,
  concatXX,
  concatXXX,
  concatXXXXXX,
  enumerateReverse,
  flatMap,
  hasOwn,
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
 *   path: import("../../path").Path,
 * ) => {[key in import("../../path").Path]?: null}}
 */
export const recordCompletion = (root, path) =>
  reduceEntry(
    map(loopAll(root.body, joinPath(path, "body"), true, {}).paths, pairupNull),
  );

/**
 * @type {(
 *   nodes: import("./completion").CompletionNode[],
 *   path: import("../../path").Path,
 *   maybe_last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion").CompletionResult}
 */
const loopAll = (nodes, path, maybe_last, labels) =>
  reduce(
    enumerateReverse(nodes.length),
    (result1, index) => {
      const result2 = loop(
        nodes[index],
        joinPath(path, index),
        result1.previous_maybe_last,
        labels,
      );
      return {
        previous_maybe_last: result2.previous_maybe_last,
        paths: concatXX(result1.paths, result2.paths),
      };
    },
    /** @type {import("./completion").CompletionResult} */ ({
      previous_maybe_last: maybe_last,
      paths: EMPTY,
    }),
  );

const getPreviousMaybeLast = compileGet("previous_maybe_last");

const getPathArray = compileGet("paths");

/**
 * @type {(
 *   node: import("./completion").CompletionNode,
 *   path: import("../../path").Path,
 *   maybe_last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion").CompletionResult}
 */
const loop = (node, path, maybe_last, labels) => {
  if (node.type === "BlockStatement") {
    return loopAll(node.body, joinPath(path, "body"), maybe_last, labels);
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    const result = loop(node.body, joinPath(path, "body"), maybe_last, {
      ...labels,
      "": maybe_last,
    });
    return {
      previous_maybe_last: false,
      paths: concatXX(
        maybe_last || result.previous_maybe_last
          ? [path, joinPath(path, "body")]
          : EMPTY,
        result.paths,
      ),
    };
  } else if (node.type === "SwitchStatement") {
    const next_label_record = { ...labels, "": maybe_last };
    const results = mapIndex(node.cases.length, (index) =>
      loop(
        node.cases[index],
        joinDeepPath(path, "cases", index),
        maybe_last,
        next_label_record,
      ),
    );
    return {
      previous_maybe_last: false,
      paths: concatXX(
        maybe_last || some(results, getPreviousMaybeLast) ? [path] : EMPTY,
        flatMap(results, getPathArray),
      ),
    };
  } else if (node.type === "SwitchCase") {
    return loopAll(
      node.consequent,
      joinPath(path, "consequent"),
      maybe_last,
      labels,
    );
  } else if (node.type === "LabeledStatement") {
    return loop(node.body, joinPath(path, "body"), maybe_last, {
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
    return { previous_maybe_last: maybe_last, paths: EMPTY };
  } else if (node.type === "IfStatement") {
    const result1 = loop(
      node.consequent,
      joinPath(path, "consequent"),
      maybe_last,
      labels,
    );
    const result2 = node.alternate
      ? loop(node.alternate, joinPath(path, "alternate"), maybe_last, labels)
      : { previous_maybe_last: maybe_last, paths: EMPTY };
    return {
      previous_maybe_last: false,
      paths: concatXXX(
        result1.previous_maybe_last || result2.previous_maybe_last
          ? [path]
          : EMPTY,
        result1.paths,
        result2.paths,
      ),
    };
  } else if (node.type === "WithStatement") {
    const result = loop(node.body, joinPath(path, "body"), maybe_last, labels);
    return {
      previous_maybe_last: false,
      paths: concatXX(
        result.previous_maybe_last ? [path] : EMPTY,
        loop(node.body, joinPath(path, "body"), maybe_last, labels).paths,
      ),
    };
  } else if (node.type === "TryStatement") {
    const result1 = loop(
      node.block,
      joinPath(path, "block"),
      maybe_last,
      labels,
    );
    const result2 =
      node.handler == null
        ? { previous_maybe_last: maybe_last, paths: EMPTY }
        : loop(
            node.handler.body,
            joinDeepPath(path, "handler", "body"),
            maybe_last,
            labels,
          );
    const result3 =
      node.finalizer == null
        ? { previous_maybe_last: maybe_last, paths: EMPTY }
        : loop(node.finalizer, joinPath(path, "finalizer"), maybe_last, labels);
    return {
      previous_maybe_last: false,
      paths: concatXXXXXX(
        result1.previous_maybe_last ? [joinPath(path, "block")] : EMPTY,
        result2.previous_maybe_last
          ? [joinDeepPath(path, "handler", "body")]
          : EMPTY,
        // Mark finalizer that have completions so
        // that the unbuild path knows it must be
        // backed up and restored.
        result3.previous_maybe_last || result3.paths.length > 0
          ? [joinPath(path, "finalizer")]
          : EMPTY,
        result1.paths,
        result2.paths,
        result3.paths,
      ),
    };
  } else if (
    node.type === "ThrowStatement" ||
    node.type === "ReturnStatement"
  ) {
    return { previous_maybe_last: false, paths: EMPTY };
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
        paths: EMPTY,
      };
    } else {
      // This should be reported as an early syntax error later.
      return {
        previous_maybe_last: false,
        paths: EMPTY,
      };
    }
  } else if (node.type === "ExpressionStatement") {
    return {
      previous_maybe_last: false,
      paths: maybe_last ? [path] : EMPTY,
    };
  } else {
    throw new AranTypeError(node);
  }
};
