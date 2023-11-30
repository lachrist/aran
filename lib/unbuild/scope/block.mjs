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
import { listSetupClosureEffect } from "../param/index.mjs";

/**
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */

/**
 * @typedef {import("./inner/index.mjs").StaticFrame} StaticFrame
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
 *   frame: StaticFrame,
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
    [...listScopeDeclareStatement({ path }, context2), ...body],
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
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     frame: StaticFrame,
 *     makeBody: (context: C) => aran.ClosureBlock<unbuild.Atom>,
 *   },
 * ) => aran.ClosureBlock<unbuild.Atom>}
 */
export const makeScopeClosureBlock = (
  { path, meta },
  context1,
  { frame, makeBody },
) => {
  const context2 = { ...context1, scope: extendStaticScope(context1, frame) };
  const { variables, statements: statements1, completion } = makeBody(context2);
  const statements2 = [
    ...map(listSetupClosureEffect({ path, meta }, context2), (node) =>
      makeEffectStatement(node, path),
    ),
    ...listScopeDeclareStatement({ path }, context2),
    ...statements1,
  ];
  return makeClosureBlock(
    [
      ...variables,
      ...listContextBoundVariable(context2, [...statements2, completion]),
    ],
    statements2,
    completion,
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
 *   frame: StaticFrame,
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
      [...listScopeDeclareStatement({ path }, context2), ...body.statements],
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
