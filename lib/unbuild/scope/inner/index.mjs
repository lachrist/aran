import { map, flatMap, hasOwn, StaticError } from "../../../util/index.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIfStatement,
} from "../../node.mjs";
import {
  listBindingVariable,
  listBindingDeclareStatement,
  listBindingInitializeStatement,
  makeBindingTypeofExpression,
  makeBindingDiscardExpression,
  makeBindingReadExpression,
  listBindingWriteEffect,
  makeMissingBinding,
  makePresentBinding,
} from "./binding/index.mjs";
import {
  makeWithExistExpression,
  makeWithReadExpression,
  makeWithTypeofExpression,
  makeWithDiscardExpression,
  makeWithWriteExpression,
} from "./with.mjs";

const {
  Error,
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @typedef {import("./binding/index.mjs").Binding} Binding */
/** @typedef {import("./binding/index.mjs").MissingBinding} MissingBinding */
/** @typedef {import("./binding/index.mjs").PresentBinding} PresentBinding */
/** @typedef {import("./binding/index.mjs").Frame} Frame */

/**
 * @typedef {{
 *   type: "root",
 *   missing: MissingBinding,
 * } | {
 *   type: "static",
 *   bindings: Record<estree.Variable, PresentBinding>,
 *   parent: Scope,
 * } | {
 *   type: "dynamic",
 *   with: unbuild.Variable,
 *   parent: Scope,
 * }} Scope
 */

/////////////////
// extendScope //
/////////////////

/** @type {Record<estree.VariableKind, aran.VariableKind>} */
const KINDS = {
  var: "var",
  function: "var",
  let: "let",
  const: "const",
  class: "let",
};

/**
 * @type {(
 *   options: {
 *     site: "global",
 *     enclave: boolean,
 *   } | {
 *     site: "global" | "local",
 *     enclave: true,
 *   },
 * ) => Scope}
 */
export const makeRootScope = (options) => ({
  type: "root",
  missing: makeMissingBinding(options),
});

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   frame: Frame,
 * ) => Scope & { type: "static" }}
 */
export const extendStaticScope = ({ strict, scope }, frame) => ({
  type: "static",
  bindings: reduceEntry(
    map(
      /** @type {[estree.Variable, estree.VariableKind][]} */ (
        listEntry(frame.kinds)
      ),
      ({ 0: variable, 1: kind }) => [
        variable,
        makePresentBinding(strict, KINDS[kind], variable, frame),
      ],
    ),
  ),
  parent: scope,
});

/**
 * @type {(
 *   context: {
 *     scope: Scope,
 *   },
 *   frame: unbuild.Variable,
 * ) => Scope}
 */
export const extendDynamicScope = ({ scope }, with_) => ({
  type: "dynamic",
  with: with_,
  parent: scope,
});

///////////////////////
// listScopeVariable //
///////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & { type: "static" },
 *   },
 * ) => unbuild.Variable[]}
 */
export const listScopeVariable = ({ strict, scope }) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingVariable(strict, binding, variable),
  );

///////////////////////////////
// makeScopeeclareStatement //
///////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & { type: "static" },
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeDeclareStatement = ({ strict, scope }) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable),
  );

///////////////////////////////////////
// makeScopeInitializeStatementArray //
///////////////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeInitializeStatement = (
  { strict, scope },
  variable,
  right,
) => {
  switch (scope.type) {
    case "root":
      throw new Error("unbound variable initialization");
    case "static":
      return hasOwn(scope.bindings, variable)
        ? listBindingInitializeStatement(
            strict,
            scope.bindings[variable],
            variable,
            right,
          )
        : listScopeInitializeStatement(
            { strict, scope: scope.parent },
            variable,
            right,
          );
    case "dynamic":
      return [
        makeIfStatement(
          makeWithExistExpression(strict, scope.with, variable),
          makeControlBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeWithWriteExpression(strict, scope.with, variable, right),
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            listScopeInitializeStatement(
              { strict, scope: scope.parent },
              variable,
              right,
            ),
          ),
        ),
      ];
    default:
      throw new StaticError("invalid scope", scope);
  }
};

///////////////////////////////
// makeScopeLookupExpression //
///////////////////////////////

/**
 * @type {(
 *   strict: boolean,
 *   scope: Scope,
 *   variable: estree.Variable,
 *   makeBindingLookupExpression: (
 *     strict: boolean,
 *     binding: Binding,
 *     variable: estree.Variable,
 *   ) => aran.Expression<unbuild.Atom>,
 *   makeWithLookupExpression: (
 *     strict: boolean,
 *     frame: unbuild.Variable,
 *     variable: estree.Variable,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  strict,
  scope,
  variable,
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root":
      return makeBindingLookupExpression(strict, scope.missing, variable);
    case "static":
      return hasOwn(scope.bindings, variable)
        ? makeBindingLookupExpression(
            strict,
            scope.bindings[variable],
            variable,
          )
        : makeScopeLookupExpression(
            strict,
            scope.parent,
            variable,
            makeBindingLookupExpression,
            makeWithLookupExpression,
          );
    case "dynamic":
      return makeConditionalExpression(
        makeWithExistExpression(strict, scope.with, variable),
        makeWithLookupExpression(strict, scope.with, variable),
        makeScopeLookupExpression(
          strict,
          scope.parent,
          variable,
          makeBindingLookupExpression,
          makeWithLookupExpression,
        ),
      );
    default:
      throw new StaticError("invalid scope", scope);
  }
};

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = ({ strict, scope }, variable) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    makeBindingReadExpression,
    makeWithReadExpression,
  );

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = ({ strict, scope }, variable) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    makeBindingTypeofExpression,
    makeWithTypeofExpression,
  );

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = ({ strict, scope }, variable) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    makeBindingDiscardExpression,
    makeWithDiscardExpression,
  );

//////////////////////////
// listScopeWriteEffect //
//////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = ({ strict, scope }, variable, right) => {
  switch (scope.type) {
    case "root":
      return listBindingWriteEffect(strict, scope.missing, variable, right);
    case "static":
      return hasOwn(scope.bindings, variable)
        ? listBindingWriteEffect(
            strict,
            scope.bindings[variable],
            variable,
            right,
          )
        : listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
          );
    case "dynamic":
      return [
        makeConditionalEffect(
          makeWithExistExpression(strict, scope.with, variable),
          [
            makeExpressionEffect(
              makeWithWriteExpression(strict, scope.with, variable, right),
            ),
          ],
          listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
          ),
        ),
      ];
    default:
      throw new StaticError("invalid scope", scope);
  }
};
