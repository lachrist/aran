import { map, removeDuplicate } from "../../util/index.mjs";
import {
  makeClosureBlock,
  makeControlBlock,
  makePseudoBlock,
} from "../node.mjs";
import {
  extendScope,
  listScopeDeclareStatement,
  listScopeVariable,
} from "./inner/index.mjs";
import { collectBoundVariable } from "./collect.mjs";
import { escapeExpression, escapeStatement } from "./escape.mjs";

/**
 * @template T
 * @typedef {{
 *   strict: boolean,
 *   scope: import("./inner/index.mjs").Scope<T>,
 *   escape: estree.Variable,
 * }} Context
 */

/**
 * @template T
 * @typedef {import("./inner/index.mjs").FrameMaterial<T>} Frame
 */

/**
 * @type {<T, C extends Context<T> & { scope: {} }>(
 *   context: C,
 *   nodes: aran.Node<unbuild.Atom<T>>[],
 * ) => unbuild.Variable[]}
 */
const listContextBoundVariable = (context, nodes) =>
  removeDuplicate([
    ...listScopeVariable(context),
    ...collectBoundVariable(nodes),
  ]);

/**
 * @type {<T, C extends Context<T>>(
 *   context: C,
 *   frame: Frame<T>,
 * ) => C & { scope: {} }}
 */
const extendContext = (context, frame) => ({
  ...context,
  scope: extendScope(context, frame),
});

/**
 * @type {<T, C extends Context<T> & { scope: {} }>(
 *   context: C,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<T>>[],
 *   tag: T,
 * ) => aran.Statement<unbuild.Atom<T>>[]}
 */
const makeContextBody = (context, makeBody, tag) => [
  ...listScopeDeclareStatement(context, tag),
  ...makeBody(context),
];

/**
 * @type {<T, C extends Context<T>>(
 *   context1: C,
 *   frame: Frame<T>,
 *   labels: unbuild.Label[],
 *   makeBody: (context2: C) => aran.Statement<unbuild.Atom<T>>[],
 *   tag: T,
 * ) => aran.ControlBlock<unbuild.Atom<T>>}
 */
export const makeScopeControlBlock = (
  context1,
  frame,
  labels,
  makeBody,
  tag,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, tag);
  return makeControlBlock(
    labels,
    listContextBoundVariable(context2, body),
    body,
    tag,
  );
};

/**
 * @type {<T, C extends Context<T>>(
 *   context: C,
 *   frame: Frame<T>,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<T>>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.ClosureBlock<unbuild.Atom<T>>}
 */
export const makeScopeClosureBlock = (
  context1,
  frame,
  makeBody,
  makeCompletion,
  tag,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, tag);
  const completion = makeCompletion(context2);
  return makeClosureBlock(
    listContextBoundVariable(context2, [...body, completion]),
    body,
    completion,
    tag,
  );
};

/**
 * @type {<T, C extends Context<T>>(
 *   context: C,
 *   frame: Frame<T>,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<T>>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom<T>>,
 *   tag: T,
 * ) => aran.PseudoBlock<unbuild.Atom<T>>}
 */
export const makeScopePseudoBlock = (
  context1,
  frame,
  makeBody,
  makeCompletion,
  tag,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, tag);
  const completion = makeCompletion(context2);
  const variables = listContextBoundVariable(context2, [...body, completion]);
  return makePseudoBlock(
    map(body, (statement) =>
      escapeStatement(statement, context2.escape, variables),
    ),
    escapeExpression(completion, context2.escape, variables),
    tag,
  );
};
