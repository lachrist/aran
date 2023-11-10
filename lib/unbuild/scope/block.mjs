import { reduce, removeDuplicate } from "../../util/index.mjs";
import {
  log,
  makeClosureBlock,
  makeControlBlock,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makePseudoBlock,
} from "../node.mjs";
import {
  extendStaticScope,
  listScopeDeclareStatement,
  listScopeVariable,
} from "./inner/index.mjs";
import { collectBoundMetaVariable } from "./collect.mjs";
import { escapePseudoBlock } from "../../escape.mjs";
import { makeGetExpression, makeSetExpression } from "../intrinsic.mjs";

/**
 * @typedef {import("../param/index.mjs").Param} Param
 */

/**
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */

/**
 * @typedef {import("./inner/index.mjs").Frame} Frame
 */

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   scope: Scope & { type: "static"},
 * }>(
 *   context: C,
 *   nodes: aran.Node<unbuild.Atom>[],
 * ) => unbuild.Variable[]}
 */
const listContextBoundVariable = (context, nodes) =>
  removeDuplicate([
    ...listScopeVariable(context),
    ...collectBoundMetaVariable(nodes),
  ]);

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   scope: Scope,
 * }>(
 *   context: C,
 *   frame: Frame,
 * ) => C & { scope: { type: "static" } }}
 */
const extendContext = (context, frame) => ({
  ...context,
  scope: extendStaticScope(context, frame),
});

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   param: Param,
 *   scope: Scope & { type: "static"},
 * }>(
 *   context: C,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const makeContextBody = (context, makeBody, path) => [
  ...listScopeDeclareStatement(context, path),
  ...makeBody(context),
];

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   param: Param,
 *   scope: Scope,
 * }>(
 *   context1: C,
 *   frame: Frame,
 *   labels: unbuild.Label[],
 *   makeBody: (context2: C) => aran.Statement<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const makeScopeControlBlock = (
  context1,
  frame,
  labels,
  makeBody,
  path,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, path);
  return makeControlBlock(
    labels,
    listContextBoundVariable(context2, body),
    body,
    path,
  );
};

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   param: Param,
 *   scope: Scope,
 * }>(
 *   context: C,
 *   frame: Frame,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeScopeClosureBlock = (
  context1,
  frame,
  makeBody,
  makeCompletion,
  path,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, path);
  const completion = makeCompletion(context2);
  return makeClosureBlock(
    listContextBoundVariable(context2, [...body, completion]),
    body,
    completion,
    path,
  );
};

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   param: Param,
 *   scope: Scope,
 *   root: import("../../../type/options.d.ts").Root,
 * }>(
 *   context: C,
 *   frame: Frame,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.PseudoBlock<unbuild.Atom>}
 */
export const makeScopePseudoBlock = (
  context1,
  frame,
  makeBody,
  makeCompletion,
  path,
) => {
  const { root } = context1;
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, path);
  const completion = makeCompletion(context2);
  const variables = listContextBoundVariable(context2, [...body, completion]);
  return escapePseudoBlock(makePseudoBlock(body, completion, path), variables, {
    makeReadExpression: (variable, { logs, path }) =>
      reduce(
        logs,
        log,
        makeGetExpression(
          makeIntrinsicExpression("aran.cache", path),
          makePrimitiveExpression(`${root}.${variable}`, path),
          path,
        ),
      ),
    makeWriteEffect: (variable, right, { logs, path }) =>
      reduce(
        logs,
        log,
        makeExpressionEffect(
          makeSetExpression(
            "strict",
            makeIntrinsicExpression("aran.cache", path),
            makePrimitiveExpression(`${root}.${variable}`, path),
            right,
            path,
          ),
          path,
        ),
      ),
  });
};
