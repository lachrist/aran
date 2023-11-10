import { AranTypeError } from "../../util/error.mjs";
import { guard } from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeDeclareGlobalStatement,
  makeEffectStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadGlobalExpression,
  makeReadParameterExpression,
  makeTypeofGlobalExpression,
  makeWriteGlobalEffect,
} from "../node.mjs";
import { logEnclaveLimitation } from "../report.mjs";

const { Error } = globalThis;

/**
 * @typedef {import("./param.d.ts").Param} Param
 */

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     param: Param,
 *   },
 *   kind: "let" | "const" | "var",
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listDeclareEnclaveStatement = (
  { mode, param: { situ } },
  kind,
  variable,
  { path },
) => {
  switch (situ) {
    case "global": {
      return kind === "var"
        ? [
            guard(
              mode === "sloppy",
              (node) =>
                logEnclaveLimitation(
                  node,
                  `Converting declaration of global variable '${variable}' from sloppy to strict`,
                ),
              makeDeclareGlobalStatement(
                "var",
                variable,
                makePrimitiveExpression({ undefined: null }, path),
                path,
              ),
            ),
          ]
        : [];
    }
    case "local": {
      throw new Error("Cannot declare external variable in local eval");
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
 *   kind: "let" | "const" | "var",
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listInitializeEnclaveStatement = (
  { param: { situ } },
  kind,
  variable,
  right,
  { path },
) => {
  switch (situ) {
    case "global": {
      return kind === "var"
        ? [
            makeEffectStatement(
              makeWriteGlobalEffect(variable, right, path),
              path,
            ),
          ]
        : [makeDeclareGlobalStatement(kind, variable, right, path)];
    }
    case "local": {
      throw new Error("Cannot declare external variable in local eval");
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
 *     mode: "strict" | "sloppy",
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
  { mode, param: { situ } },
  variable,
  right,
  { path },
) => {
  switch (situ) {
    case "local": {
      return [
        guard(
          mode === "sloppy",
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
          mode === "sloppy",
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
