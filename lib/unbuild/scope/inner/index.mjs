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
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeDeclareStatement = ({ strict, scope }, origin) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, origin),
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
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeInitializeStatement = (
  { strict, scope },
  variable,
  right,
  origin,
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
            origin,
          )
        : listScopeInitializeStatement(
            { strict, scope: scope.parent },
            variable,
            right,
            origin,
          );
    case "dynamic":
      return [
        makeIfStatement(
          makeWithExistExpression(strict, scope.with, variable, origin),
          makeControlBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeWithWriteExpression(
                    strict,
                    scope.with,
                    variable,
                    right,
                    origin,
                  ),
                  origin,
                ),
                origin,
              ),
            ],
            origin,
          ),
          makeControlBlock(
            [],
            [],
            listScopeInitializeStatement(
              { strict, scope: scope.parent },
              variable,
              right,
              origin,
            ),
            origin,
          ),
          origin,
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
 *   origin: unbuild.Path,
 *   makeBindingLookupExpression: (
 *     strict: boolean,
 *     binding: Binding,
 *     variable: estree.Variable,
 *     origin: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 *   makeWithLookupExpression: (
 *     strict: boolean,
 *     frame: unbuild.Variable,
 *     variable: estree.Variable,
 *     origin: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  strict,
  scope,
  variable,
  origin,
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root":
      return makeBindingLookupExpression(
        strict,
        scope.missing,
        variable,
        origin,
      );
    case "static":
      return hasOwn(scope.bindings, variable)
        ? makeBindingLookupExpression(
            strict,
            scope.bindings[variable],
            variable,
            origin,
          )
        : makeScopeLookupExpression(
            strict,
            scope.parent,
            variable,
            origin,
            makeBindingLookupExpression,
            makeWithLookupExpression,
          );
    case "dynamic":
      return makeConditionalExpression(
        makeWithExistExpression(strict, scope.with, variable, origin),
        makeWithLookupExpression(strict, scope.with, variable, origin),
        makeScopeLookupExpression(
          strict,
          scope.parent,
          variable,
          origin,
          makeBindingLookupExpression,
          makeWithLookupExpression,
        ),
        origin,
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
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = ({ strict, scope }, variable, origin) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    origin,
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
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = (
  { strict, scope },
  variable,
  origin,
) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    origin,
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
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = (
  { strict, scope },
  variable,
  origin,
) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    origin,
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
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = (
  { strict, scope },
  variable,
  right,
  origin,
) => {
  switch (scope.type) {
    case "root":
      return listBindingWriteEffect(
        strict,
        scope.missing,
        variable,
        right,
        origin,
      );
    case "static":
      return hasOwn(scope.bindings, variable)
        ? listBindingWriteEffect(
            strict,
            scope.bindings[variable],
            variable,
            right,
            origin,
          )
        : listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            origin,
          );
    case "dynamic":
      return [
        makeConditionalEffect(
          makeWithExistExpression(strict, scope.with, variable, origin),
          [
            makeExpressionEffect(
              makeWithWriteExpression(
                strict,
                scope.with,
                variable,
                right,
                origin,
              ),
              origin,
            ),
          ],
          listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            origin,
          ),
          origin,
        ),
      ];
    default:
      throw new StaticError("invalid scope", scope);
  }
};
