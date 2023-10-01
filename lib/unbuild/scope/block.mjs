import { map, removeDuplicate } from "../../util/index.mjs";
import {
  makeClosureBlock,
  makeControlBlock,
  makePseudoBlock,
} from "../node.mjs";
import {
  extendStaticScope,
  listScopeDeclareStatement,
  listScopeVariable,
} from "./inner/index.mjs";
import { collectBoundVariable } from "./collect.mjs";
import { escapeExpression, escapeStatement } from "./escape.mjs";

/**
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */

/**
 * @typedef {import("./inner/index.mjs").Frame} Frame
 */

/**
 * @type {<S, C extends {strict: boolean, scope: Scope & { type: "static" }}>(
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
 * @type {<C extends {strict: boolean, scope: Scope}>(
 *   context: C,
 *   frame: Frame,
 * ) => C & { scope: { type: "static" } }}
 */
const extendContext = (context, frame) => ({
  ...context,
  scope: extendStaticScope(context, frame),
});

/**
 * @type {<S, C extends {strict: boolean, scope: Scope & { type: "static" }}>(
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
 * @type {<S, C extends {strict: boolean, scope: Scope}>(
 *   context1: C,
 *   frame: Frame,
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
 * @type {<S, C extends {strict: boolean, scope: Scope}>(
 *   context: C,
 *   frame: Frame,
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
 * @type {<S, C extends {strict: boolean, scope: Scope, root: unbuild.Root}>(
 *   context: C,
 *   frame: Frame,
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
      escapeStatement(statement, context1.root, variables),
    ),
    escapeExpression(completion, context1.root, variables),
    serial,
  );
};
