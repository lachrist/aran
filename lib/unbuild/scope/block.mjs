import { filter, map, removeAll } from "../../util/index.mjs";
import { isMetaVariable } from "../mangle.mjs";
import {
  makeClosureBlock,
  makeControlBlock,
  makePseudoBlock,
} from "../node.mjs";
import {
  extendScope,
  listScopeDeclareStatement,
  listScopeFreeVariable,
  listScopeVariable,
} from "./inner/index.mjs";
import { collectFreeVariable } from "./collect.mjs";
import { escapeExpression, escapeStatement } from "./escape.mjs";

const {
  Object: { values: listValue },
} = globalThis;

/**
 * @template S
 * @typedef {{
 *   strict: boolean,
 *   scope: import("./inner/index.mjs").Scope<S>,
 *   record: {[key in string]: unbuild.Variable},
 *   escape: estree.Variable,
 * }} Context
 */

/**
 * @template S
 * @typedef {import("./inner/index.mjs").FrameContext<S>} FrameContext
 */

/** @type {<S, C extends Context<S>>(context: C) => unbuild.Variable[]} */
const listContextFreeVariable = (context) => [
  ...listValue(context.record),
  ...listScopeFreeVariable(context),
];

/**
 * @type {<S, C extends Context<S>>(
 *   context: C,
 *   nodes: aran.Node<unbuild.Atom<S>>[],
 * ) => unbuild.Variable[]}
 */
const listContextBoundVariable = (context, nodes) => [
  ...listScopeVariable(context),
  ...removeAll(
    filter(collectFreeVariable(nodes), isMetaVariable),
    listContextFreeVariable(context),
  ),
];

/**
 * @type {<S, C extends Context<S>>(
 *   context: C,
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 *   frame: FrameContext<S>,
 * ) => C}
 */
const extendContext = (context, kinds, frame) => ({
  ...context,
  scope: extendScope(context, kinds, frame),
});

/**
 * @type {<S, C extends Context<S>>(
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
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 *   frame: FrameContext<S>,
 *   labels: unbuild.Label[],
 *   makeBody: (context2: C) => aran.Statement<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const makeScopeControlBlock = (
  context1,
  kinds,
  frame,
  labels,
  makeBody,
  serial,
) => {
  const context2 = extendContext(context1, kinds, frame);
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
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 *   frame: FrameContext<S>,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<S>>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.ClosureBlock<unbuild.Atom<S>>}
 */
export const makeScopeClosureBlock = (
  context1,
  kinds,
  frame,
  makeBody,
  makeCompletion,
  serial,
) => {
  const context2 = extendContext(context1, kinds, frame);
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
 *   kinds: Record<estree.Variable, estree.VariableKind>,
 *   frame: FrameContext<S>,
 *   makeBody: (context: C) => aran.Statement<unbuild.Atom<S>>[],
 *   makeCompletion: (context: C) => aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.PseudoBlock<unbuild.Atom<S>>}
 */
export const makeScopePseudoBlock = (
  context1,
  kinds,
  frame,
  makeBody,
  makeCompletion,
  serial,
) => {
  const context2 = extendContext(context1, kinds, frame);
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
