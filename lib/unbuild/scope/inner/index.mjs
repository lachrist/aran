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
 *   kind: "global.internal" | "global.external" | "local.external",
 * ) => Scope}
 */
export const makeRootScope = (kind) => ({
  type: "root",
  missing: makeMissingBinding(kind),
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
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & { type: "static" },
 *   },
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listScopeDeclareStatement = ({ strict, scope }, serial) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, serial),
  );

///////////////////////////////////////
// makeScopeInitializeStatementArray //
///////////////////////////////////////

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listScopeInitializeStatement = (
  { strict, scope },
  variable,
  right,
  serial,
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
            serial,
          )
        : listScopeInitializeStatement(
            { strict, scope: scope.parent },
            variable,
            right,
            serial,
          );
    case "dynamic":
      return [
        makeIfStatement(
          makeWithExistExpression(strict, scope.with, variable, serial),
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
                    serial,
                  ),
                  serial,
                ),
                serial,
              ),
            ],
            serial,
          ),
          makeControlBlock(
            [],
            [],
            listScopeInitializeStatement(
              { strict, scope: scope.parent },
              variable,
              right,
              serial,
            ),
            serial,
          ),
          serial,
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
 * @type {<S>(
 *   strict: boolean,
 *   scope: Scope,
 *   variable: estree.Variable,
 *   serial: S,
 *   makeBindingLookupExpression: (
 *     strict: boolean,
 *     binding: Binding,
 *     variable: estree.Variable,
 *     serial: S,
 *   ) => aran.Expression<unbuild.Atom<S>>,
 *   makeWithLookupExpression: (
 *     strict: boolean,
 *     frame: unbuild.Variable,
 *     variable: estree.Variable,
 *     serial: S,
 *   ) => aran.Expression<unbuild.Atom<S>>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeScopeLookupExpression = (
  strict,
  scope,
  variable,
  serial,
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root":
      return makeBindingLookupExpression(
        strict,
        scope.missing,
        variable,
        serial,
      );
    case "static":
      return hasOwn(scope.bindings, variable)
        ? makeBindingLookupExpression(
            strict,
            scope.bindings[variable],
            variable,
            serial,
          )
        : makeScopeLookupExpression(
            strict,
            scope.parent,
            variable,
            serial,
            makeBindingLookupExpression,
            makeWithLookupExpression,
          );
    case "dynamic":
      return makeConditionalExpression(
        makeWithExistExpression(strict, scope.with, variable, serial),
        makeWithLookupExpression(strict, scope.with, variable, serial),
        makeScopeLookupExpression(
          strict,
          scope.parent,
          variable,
          serial,
          makeBindingLookupExpression,
          makeWithLookupExpression,
        ),
        serial,
      );
    default:
      throw new StaticError("invalid scope", scope);
  }
};

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeScopeReadExpression = ({ strict, scope }, variable, serial) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    serial,
    makeBindingReadExpression,
    makeWithReadExpression,
  );

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeScopeTypeofExpression = (
  { strict, scope },
  variable,
  serial,
) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    serial,
    makeBindingTypeofExpression,
    makeWithTypeofExpression,
  );

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeScopeDiscardExpression = (
  { strict, scope },
  variable,
  serial,
) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    serial,
    makeBindingDiscardExpression,
    makeWithDiscardExpression,
  );

//////////////////////////
// listScopeWriteEffect //
//////////////////////////

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listScopeWriteEffect = (
  { strict, scope },
  variable,
  right,
  serial,
) => {
  switch (scope.type) {
    case "root":
      return listBindingWriteEffect(
        strict,
        scope.missing,
        variable,
        right,
        serial,
      );
    case "static":
      return hasOwn(scope.bindings, variable)
        ? listBindingWriteEffect(
            strict,
            scope.bindings[variable],
            variable,
            right,
            serial,
          )
        : listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            serial,
          );
    case "dynamic":
      return [
        makeConditionalEffect(
          makeWithExistExpression(strict, scope.with, variable, serial),
          [
            makeExpressionEffect(
              makeWithWriteExpression(
                strict,
                scope.with,
                variable,
                right,
                serial,
              ),
              serial,
            ),
          ],
          listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            serial,
          ),
          serial,
        ),
      ];
    default:
      throw new StaticError("invalid scope", scope);
  }
};
