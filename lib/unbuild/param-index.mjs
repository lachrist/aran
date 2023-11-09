/**
 * @typedef {import("./param.mjs").Param} Param
 */

import { makeExpressionEffect } from "./node.mjs";
import {
  listPreludeEffect,
  listSetSuperEffect,
  makeCallSuperExpression,
  makeFunctionArgumentsExpression,
  makeGetSuperExpression,
  makeImportExpression,
  makeImportMetaExpression,
  makeNewTargetExpression,
  makeResultExpression,
  makeSetSuperExpression,
  makeThisExpression,
} from "./param.mjs";
import { makeSyntaxErrorExpression } from "./report.mjs";

/////////////////////////
// makeParamExpression //
/////////////////////////

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
 * @type {<X>(
 *   lookup: (
 *     param: Param,
 *     path: unbuild.Path,
 *   ) => X | null,
 *   missing: (path: unbuild.Path) => X,
 *   params: Param[],
 *   path: unbuild.Path,
 * ) => X}
 */
const lookupParameter = (lookup, missing, params, path) => {
  if (params.length === 0) {
    return missing(path);
  } else {
    const [head, ...tail] = params;
    const maybe = lookup(head, path);
    return maybe === null
      ? lookupParameter(lookup, missing, tail, path)
      : maybe;
  }
};

const dispatch = {
  "new.target": makeNewTargetExpression,
  "import.meta": makeImportMetaExpression,
  "function.arguments": makeFunctionArgumentsExpression,
  "this": makeThisExpression,
  "import": makeImportExpression,
};

/** @type {(path: unbuild.Path) => aran.Expression<unbuild.Atom>} */
const makeMissingParameterExpression = (path) =>
  makeSyntaxErrorExpression(`Illegal parameter access`, path);

/** @type {(path: unbuild.Path) => aran.Effect<unbuild.Atom>[]} */
const listMissingParameterEffect = (path) => [
  makeExpressionEffect(makeMissingParameterExpression(path), path),
];

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   parameter:
 *     | "import.meta"
 *     | "function.arguments"
 *     | "this"
 *     | "new.target"
 *     | "import",
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeParamExpression = ({ params }, parameter, path) =>
  lookupParameter(
    dispatch[parameter],
    makeMissingParameterExpression,
    params,
    path,
  );

///////////////////////////////
// makeParamResultExpression //
///////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   result: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeParamResultExpression = ({ params }, result, path, meta) =>
  lookupParameter(
    (param, path) => makeResultExpression(param, result, path, meta),
    makeMissingParameterExpression,
    params,
    path,
  );

/////////////////////////////////
// makeParamSuperGetExpression //
/////////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeParamGetSuperExpression = ({ params }, key, path) =>
  lookupParameter(
    (param, path) => makeGetSuperExpression(param, key, path),
    makeMissingParameterExpression,
    params,
    path,
  );

///////////////
// super.set //
///////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeParamSetSuperExpression = (
  { strict, params },
  key,
  value,
  path,
  meta,
) =>
  lookupParameter(
    (param, path) =>
      makeSetSuperExpression(strict, param, key, value, path, meta),
    makeMissingParameterExpression,
    params,
    path,
  );

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listParamSetSuperEffect = ({ strict, params }, key, value, path) =>
  lookupParameter(
    (param, path) => listSetSuperEffect(strict, param, key, value, path),
    listMissingParameterEffect,
    params,
    path,
  );

//////////////////////////////////
// makeParamCallSuperExpression //
//////////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeParamCallSuperExpression = ({ params }, arguments_, path) =>
  lookupParameter(
    (param, path) => makeCallSuperExpression(param, arguments_, path),
    makeMissingParameterExpression,
    params,
    path,
  );

////////////////////////////
// listParamPreludeEffect //
////////////////////////////

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     params: Param[],
 *   },
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listParamPreludeEffect = ({ params: [param], strict }, path) =>
  listPreludeEffect(strict, param, path);
