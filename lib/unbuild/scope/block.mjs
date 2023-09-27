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
 * @template S
 * @typedef {{
 *   strict: boolean,
 *   scope: import("./inner/index.mjs").Scope<S>,
 *   escape: estree.Variable,
 * }} Context
 */

/**
 * @template S
 * @typedef {import("./inner/index.mjs").FrameMaterial<S>} Frame
 */

/**
 * @type {<S, C extends Context<S> & { scope: {} }>(
 *   context: C,
 *   nodes: aran.Node<unbuild.Atom<S>>[],
 * ) => unbuild.Variable[]}
 */
const listContextBoundVariable = (context, nodes) =>
  removeDuplicate([
    ...listScopeVariable(context),
    ...collectBoundVariable(nodes),
  ]);

/**
 * @type {<S, C extends Context<S>>(
 *   context: C,
 *   frame: Frame<S>,
 * ) => C & { scope: {} }}
 */
const extendContext = (context, frame) => ({
  ...context,
  scope: extendScope(context, frame),
});

/**
 * @type {<S, C extends Context<S> & { scope: {} }>(
 *   context: C,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const makeContextBody = (context, makeBody, serial) => [
  ...listScopeDeclareStatement(context, serial),
  ...makeBody(context),
];

/**
 * @type {<S, C extends Context<S>>(
 *   context1: C,
 *   frame: Frame<S>,
 *   labels: unbuild.Label[],
 *   makeBody: (context2: C) => aran.Statement<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const makeScopeControlBlock = (
  context1,
  frame,
  labels,
  makeBody,
  serial,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, serial);
  return makeControlBlock(
    labels,
    listContextBoundVariable(context2, body),
    body,
    serial,
  );
};

/**
 * @type {<S, C extends Context<S>>(
 *   context: C,
 *   frame: Frame<S>,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<S>>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.ClosureBlock<unbuild.Atom<S>>}
 */
export const makeScopeClosureBlock = (
  context1,
  frame,
  makeBody,
  makeCompletion,
  serial,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, serial);
  const completion = makeCompletion(context2);
  return makeClosureBlock(
    listContextBoundVariable(context2, [...body, completion]),
    body,
    completion,
    serial,
  );
};

/**
 * @type {<S, C extends Context<S>>(
 *   context: C,
 *   frame: Frame<S>,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<S>>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.PseudoBlock<unbuild.Atom<S>>}
 */
export const makeScopePseudoBlock = (
  context1,
  frame,
  makeBody,
  makeCompletion,
  serial,
) => {
  const context2 = extendContext(context1, frame);
  const body = makeContextBody(context2, makeBody, serial);
  const completion = makeCompletion(context2);
  const variables = listContextBoundVariable(context2, [...body, completion]);
  return makePseudoBlock(
    map(body, (statement) =>
      escapeStatement(statement, context2.escape, variables),
    ),
    escapeExpression(completion, context2.escape, variables),
    serial,
  );
};
