/* eslint-disable no-use-before-define */

import { AranTypeError } from "../error.mjs";
import { joinDeepPath, joinPath } from "../path.mjs";
import {
  EMPTY,
  concatXX,
  concatXXX,
  enumerateReverse,
  flatMapIndex,
  hasOwn,
  map,
  reduce,
  reduceEntry,
} from "../util/index.mjs";

/** @type {import("./completion").VoidCompletion} */
export const VOID_COMPLETION = { type: "void" };

/**
 * @type {<X>(
 *   first: X,
 * ) => [X, null]}
 */
const pairupNull = (first) => [first, null];

/**
 * @type {(
 *   root: import("../estree").Program,
 *   path: import("../path").Path,
 * ) => {[key in import("../path").Path]: null | undefined}}
 */
export const recordCompletion = (root, path) =>
  reduceEntry(
    map(loopAll(root.body, joinPath(path, "body"), true, {}).paths, pairupNull),
  );

/**
 * @type {(
 *   nodes: import("./completion").CompletionNode[],
 *   path: import("../path").Path,
 *   last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion").CompletionResult}
 */
const loopAll = (nodes, path, last, labels) =>
  reduce(
    enumerateReverse(nodes.length),
    ({ paths: paths1, last: last1 }, index) => {
      const { paths: paths2, last: last2 } = loop(
        nodes[index],
        joinPath(path, index),
        last1,
        labels,
      );
      return {
        last: last2,
        paths: concatXX(paths1, paths2),
      };
    },
    /** @type {import("./completion").CompletionResult} */ ({
      last,
      paths: EMPTY,
    }),
  );

/**
 * @type {(
 *   node: import("./completion").CompletionNode,
 *   path: import("../path").Path,
 *   last: boolean,
 *   labels: {[key in string]?: boolean},
 * ) => import("./completion").CompletionResult}
 */
const loop = (node, path, last, labels) => {
  if (node.type === "BlockStatement" || node.type === "StaticBlock") {
    return loopAll(node.body, joinPath(path, "body"), last, labels);
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    return {
      last: false,
      paths: loop(node.body, joinPath(path, "body"), last, {
        ...labels,
        "": last,
      }).paths,
    };
  } else if (node.type === "SwitchStatement") {
    const next_label_record = { ...labels, "": last };
    return {
      last: false,
      paths: flatMapIndex(
        node.cases.length,
        (index) =>
          loop(
            node.cases[index],
            joinDeepPath(path, "cases", index),
            last,
            next_label_record,
          ).paths,
      ),
    };
  } else if (node.type === "SwitchCase") {
    return loopAll(node.consequent, joinPath(path, "consequent"), last, labels);
  } else if (node.type === "CatchClause") {
    return loop(node.body, joinPath(path, "body"), last, {
      ...labels,
      "": last,
    });
  } else if (node.type === "LabeledStatement") {
    return loop(node.body, joinPath(path, "body"), last, {
      ...labels,
      [node.label.name]: last,
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
    return { last, paths: EMPTY };
  } else if (node.type === "IfStatement") {
    return {
      last: false,
      paths: concatXX(
        loop(node.consequent, joinPath(path, "consequent"), last, labels).paths,
        node.alternate
          ? loop(node.alternate, joinPath(path, "alternate"), last, labels)
              .paths
          : EMPTY,
      ),
    };
  } else if (node.type === "WithStatement") {
    return {
      last: false,
      paths: loop(node.body, joinPath(path, "body"), last, labels).paths,
    };
  } else if (node.type === "TryStatement") {
    return {
      last: false,
      paths: concatXXX(
        loop(node.block, joinPath(path, "block"), last, labels).paths,
        node.handler
          ? loop(node.handler, joinPath(path, "handler"), last, labels).paths
          : EMPTY,
        node.finalizer
          ? loop(node.finalizer, joinPath(path, "finalizer"), false, labels)
              .paths
          : EMPTY,
      ),
    };
  } else if (
    node.type === "ThrowStatement" ||
    node.type === "ContinueStatement" ||
    node.type === "ReturnStatement"
  ) {
    return { last: false, paths: EMPTY };
  } else if (node.type === "BreakStatement") {
    const label = node.label == null ? "" : node.label.name;
    if (hasOwn(labels, label)) {
      return {
        last: labels[label],
        paths: EMPTY,
      };
    } else {
      // This should be reported as an early syntax error later.
      return {
        last: false,
        paths: EMPTY,
      };
    }
  } else if (node.type === "ExpressionStatement") {
    return {
      last: false,
      paths: last ? [path] : EMPTY,
    };
  } else {
    throw new AranTypeError(node);
  }
};
