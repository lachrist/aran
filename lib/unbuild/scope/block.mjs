import { map, reduce, removeDuplicate } from "../../util/index.mjs";
import {
  report,
  makeClosureBlock,
  makeControlBlock,
  makeEffectStatement,
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
import { listSetupEffect } from "../param/index.mjs";

/**
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */

/**
 * @typedef {import("./inner/index.mjs").Frame} Frame
 */

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   root: import("../program.js").RootProgram,
 *   scope: Scope,
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
 *   root: import("../program.js").RootProgram,
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
  const context2 = { ...context1, scope: extendStaticScope(context1, frame) };
  const body = makeBody(context2);
  return makeControlBlock(
    labels,
    listContextBoundVariable(context2, body),
    [...listScopeDeclareStatement(context2, path), ...body],
    path,
  );
};

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   root: import("../program.js").RootProgram,
 *   scope: Scope,
 *   closure: import("../param/closure/closure.d.ts").Closure,
 * }>(
 *   context: C,
 *   frame: Frame,
 *   makeBody: (context: C) => aran.ClosureBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeScopeClosureBlock = (context1, frame, makeBody, path) => {
  const context2 = { ...context1, scope: extendStaticScope(context1, frame) };
  const body = makeBody(context2);
  return makeClosureBlock(
    [
      ...body.variables,
      ...listContextBoundVariable(context2, [
        ...body.statements,
        body.completion,
      ]),
    ],
    [
      ...map(listSetupEffect(context2, { path }), (node) =>
        makeEffectStatement(node, path),
      ),
      ...listScopeDeclareStatement(context2, path),
      ...body.statements,
    ],
    body.completion,
    path,
  );
};

/**
 * @type {<C extends {
 *   mode: "strict" | "sloppy",
 *   root: import("../program.js").RootProgram,
 *   scope: Scope,
 *   base: import("../../../type/options.d.ts").Base,
 * }>(
 *   context: C,
 *   frame: Frame,
 *   makeBody: (context: C) => aran.PseudoBlock<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.PseudoBlock<unbuild.Atom>}
 */
export const makeScopePseudoBlock = (context1, frame, makeBody, path) => {
  const { base } = context1;
  const context2 = { ...context1, scope: extendStaticScope(context1, frame) };
  const body = makeBody(context2);
  return escapePseudoBlock(
    makePseudoBlock(
      [...listScopeDeclareStatement(context2, path), ...body.statements],
      body.completion,
      path,
    ),
    listContextBoundVariable(context2, [...body.statements, body.completion]),
    {
      makeReadExpression: (variable, { logs, path }) =>
        reduce(
          logs,
          report,
          makeGetExpression(
            makeIntrinsicExpression("aran.cache", path),
            makePrimitiveExpression(`${base}.${variable}`, path),
            path,
          ),
        ),
      makeWriteEffect: (variable, right, { logs, path }) =>
        reduce(
          logs,
          report,
          makeExpressionEffect(
            makeSetExpression(
              "strict",
              makeIntrinsicExpression("aran.cache", path),
              makePrimitiveExpression(`${base}.${variable}`, path),
              right,
              path,
            ),
            path,
          ),
        ),
    },
  );
};
