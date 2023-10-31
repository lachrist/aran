import { map, flatMap, hasOwn, AranTypeError } from "../../../util/index.mjs";
import { listCacheSaveEffect, listCacheSaveStatement } from "../../cache.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeEffectStatement,
  makeExpressionEffect,
  makeIfStatement,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../report.mjs";
import {
  listBindingVariable,
  listBindingDeclareStatement,
  listBindingInitializeStatement,
  makeBindingTypeofExpression,
  makeBindingDiscardExpression,
  makeBindingReadExpression,
  listBindingWriteEffect,
} from "./binding/index.mjs";
import {
  makeMissingBinding,
  makePresentBinding,
  cleanupFrame,
} from "./frame.mjs";
import {
  listPreludeEffect,
  makeCallSuperExpression,
  makeCatchErrorExpression,
  makeFunctionArgumentsExpression,
  makeGetSuperExpression,
  makeImportExpression,
  makeImportMetaExpression,
  makeNewTargetExpression,
  makeResultExpression,
  makeSetSuperExpression,
  makeThisExpression,
} from "./param.mjs";
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
/** @typedef {import("./frame.mjs").Frame} Frame */
/** @typedef {import("./param.mjs").Param} Param */
/** @typedef {import("./param.mjs").ClosureParam} ClosureParam */
/** @typedef {import("../../cache.mjs").Cache} Cache */

/**
 * @typedef {{
 *   type: "root",
 *   missing: MissingBinding,
 * } | {
 *   type: "static",
 *   bindings: Record<estree.Variable, PresentBinding>,
 *   param: Param,
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
  param: cleanupFrame(frame),
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
// listScopeDeclareStatement //
///////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & { type: "static" },
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeDeclareStatement = ({ strict, scope }, path) =>
  flatMap(
    /** @type {[estree.Variable, PresentBinding][]} */ (
      listEntry(scope.bindings)
    ),
    ({ 0: variable, 1: binding }) =>
      listBindingDeclareStatement(strict, binding, variable, path),
  );

//////////////////////////////////
// listScopeInitializeStatement //
//////////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   right: import("../../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listScopeInitializeStatement = (
  { strict, scope },
  variable,
  right,
  path,
) => {
  switch (scope.type) {
    case "root": {
      throw new Error("unbound variable initialization");
    }
    case "static": {
      return hasOwn(scope.bindings, variable)
        ? listBindingInitializeStatement(
            strict,
            scope.bindings[variable],
            variable,
            right,
            path,
          )
        : listScopeInitializeStatement(
            { strict, scope: scope.parent },
            variable,
            right,
            path,
          );
    }
    case "dynamic": {
      return listCacheSaveStatement(right, path, (right) => [
        makeIfStatement(
          makeWithExistExpression(strict, scope.with, variable, path),
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
                    path,
                  ),
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
          makeControlBlock(
            [],
            [],
            listScopeInitializeStatement(
              { strict, scope: scope.parent },
              variable,
              right,
              path,
            ),
            path,
          ),
          path,
        ),
      ]);
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
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
 *   path: unbuild.Path,
 *   makeBindingLookupExpression: (
 *     strict: boolean,
 *     binding: Binding,
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 *   makeWithLookupExpression: (
 *     strict: boolean,
 *     frame: unbuild.Variable,
 *     variable: estree.Variable,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeScopeLookupExpression = (
  strict,
  scope,
  variable,
  path,
  makeBindingLookupExpression,
  makeWithLookupExpression,
) => {
  switch (scope.type) {
    case "root": {
      return makeBindingLookupExpression(strict, scope.missing, variable, path);
    }
    case "static": {
      return hasOwn(scope.bindings, variable)
        ? makeBindingLookupExpression(
            strict,
            scope.bindings[variable],
            variable,
            path,
          )
        : makeScopeLookupExpression(
            strict,
            scope.parent,
            variable,
            path,
            makeBindingLookupExpression,
            makeWithLookupExpression,
          );
    }
    case "dynamic": {
      return makeConditionalExpression(
        makeWithExistExpression(strict, scope.with, variable, path),
        makeWithLookupExpression(strict, scope.with, variable, path),
        makeScopeLookupExpression(
          strict,
          scope.parent,
          variable,
          path,
          makeBindingLookupExpression,
          makeWithLookupExpression,
        ),
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeReadExpression = ({ strict, scope }, variable, path) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    path,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeTypeofExpression = ({ strict, scope }, variable, path) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    path,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeDiscardExpression = ({ strict, scope }, variable, path) =>
  makeScopeLookupExpression(
    strict,
    scope,
    variable,
    path,
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
 *   right: import("../../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopeWriteEffect = (
  { strict, scope },
  variable,
  right,
  path,
) => {
  switch (scope.type) {
    case "root": {
      return listBindingWriteEffect(
        strict,
        scope.missing,
        variable,
        right,
        path,
      );
    }
    case "static": {
      return hasOwn(scope.bindings, variable)
        ? listBindingWriteEffect(
            strict,
            scope.bindings[variable],
            variable,
            right,
            path,
          )
        : listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            path,
          );
    }
    case "dynamic": {
      return listCacheSaveEffect(right, path, (right) => [
        makeConditionalEffect(
          makeWithExistExpression(strict, scope.with, variable, path),
          [
            makeExpressionEffect(
              makeWithWriteExpression(
                strict,
                scope.with,
                variable,
                right,
                path,
              ),
              path,
            ),
          ],
          listScopeWriteEffect(
            { strict, scope: scope.parent },
            variable,
            right,
            path,
          ),
          path,
        ),
      ]);
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

//////////////////////////////////
// makeScopeParameterExpression //
//////////////////////////////////

/**
 * @typedef {(
 *   | "super.get"
 *   | "super.set"
 *   | "super.call"
 *   | "catch.error"
 *   | "import.meta"
 *   | "function.arguments"
 *   | "this"
 *   | "new.target"
 *   | "import"
 * )} Parameter
 */

/**
 * @type {(
 *   lookup: (
 *     param: Param,
 *     path: unbuild.Path,
 *   ) => aran.Expression<unbuild.Atom> | null,
 *   scope: Scope,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const lookupParameter = (lookup, scope, path) => {
  switch (scope.type) {
    case "dynamic": {
      return lookupParameter(lookup, scope.parent, path);
    }
    case "root": {
      return makeSyntaxErrorExpression("Illegal parameter access", path);
    }
    case "static": {
      const maybe = lookup(scope.param, path);
      return maybe === null
        ? lookupParameter(lookup, scope.parent, path)
        : maybe;
    }
    default: {
      throw new AranTypeError("invalid scope", scope);
    }
  }
};

const dispatch = {
  "new.target": makeNewTargetExpression,
  "import.meta": makeImportMetaExpression,
  "catch.error": makeCatchErrorExpression,
  "function.arguments": makeFunctionArgumentsExpression,
  "this": makeThisExpression,
  "import": makeImportExpression,
};

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   parameter:
 *     | "catch.error"
 *     | "import.meta"
 *     | "function.arguments"
 *     | "this"
 *     | "new.target"
 *     | "import",
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeParameterExpression = ({ scope }, parameter, path) =>
  lookupParameter(dispatch[parameter], scope, path);

//////////////////////////
// makeResultExpression //
//////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   result: Cache | null,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeResultExpression = ({ scope }, result, path) =>
  lookupParameter(
    (param, path) => makeResultExpression(param, result, path),
    scope,
    path,
  );

////////////////////////////
// makeSuperGetExpression //
////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeGetSuperExpression = ({ scope }, key, path) =>
  lookupParameter(
    (param, path) => makeGetSuperExpression(param, key, path),
    scope,
    path,
  );

////////////////////////////
// makeSuperSetExpression //
////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   key: Cache,
 *   value: Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeSetSuperExpression = (
  { strict, scope },
  key,
  value,
  path,
) =>
  lookupParameter(
    (param, path) => makeSetSuperExpression(strict, param, key, value, path),
    scope,
    path,
  );

/////////////////////////////
// makeSuperCallExpression //
/////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope,
 *   },
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeScopeCallSuperExpression = ({ scope }, arguments_, path) =>
  lookupParameter(
    (param, path) => makeCallSuperExpression(param, arguments_, path),
    scope,
    path,
  );

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     scope: Scope & { type: "static" },
 *   },
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listScopePreludeEffect = ({ scope: { param }, strict }, path) =>
  listPreludeEffect(strict, param, path);
