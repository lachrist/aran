import { AranTypeError } from "../../util/error.mjs";
import { guard } from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadGlobalExpression,
  makeReadParameterExpression,
  makeTypeofGlobalExpression,
  makeWriteGlobalEffect,
} from "../node.mjs";
import { logEnclaveLimitation } from "../report.mjs";

/**
 * @typedef {import("./param.d.ts").Param} Param
 */

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadEnclaveExpression = (
  { param: { situ } },
  variable,
  { path },
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.read", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    }
    case "global": {
      return makeReadGlobalExpression(variable, path);
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofEnclaveExpression = (
  { param: { situ } },
  variable,
  { path },
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.typeof", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    }
    case "global": {
      return makeTypeofGlobalExpression(variable, path);
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     param: Param,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDidscardEnclaveExpression = (
  { param: { situ } },
  variable,
  { path },
) =>
  logEnclaveLimitation(
    makePrimitiveExpression(false, path),
    `Ignoring discard of ${situ} variable '${variable}'`,
  );

/**
 * @type {(
 *   context: {
 *     strict: boolean,
 *     param: Param,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteEnclaveEffect = (
  { strict, param: { situ } },
  variable,
  right,
  { path },
) => {
  switch (situ) {
    case "local": {
      return [
        guard(
          !strict,
          (node) =>
            logEnclaveLimitation(
              node,
              `Converting write to local variable '${variable}' from sloppy to strict`,
            ),
          makeExpressionEffect(
            makeApplyExpression(
              makeReadParameterExpression("scope.write", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makePrimitiveExpression(variable, path), right],
              path,
            ),
            path,
          ),
        ),
      ];
    }
    case "global": {
      return [
        guard(
          !strict,
          (node) =>
            logEnclaveLimitation(
              node,
              `Converting write to global variable '${variable}' from sloppy to strict`,
            ),
          makeWriteGlobalEffect(variable, right, path),
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};
