import { AranTypeError } from "../../util/error.mjs";
import { guard } from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeDeclareGlobalStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadGlobalExpression,
  makeReadParameterExpression,
  makeTypeofGlobalExpression,
  makeWriteGlobalEffect,
} from "../node.mjs";
import { logEnclaveLimitation } from "../report.mjs";

/**
 * @type {(
 *   context: {
 *     root: import("../context").AlienGlobalRoot,
 *   },
 *   kind: "let" | "const" | "var",
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   }
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listDeclareAlienStatement = (
  _context,
  kind,
  variable,
  right,
  { path },
) => [makeDeclareGlobalStatement(kind, variable, right, path)];

/**
 * @type {(
 *   context: {
 *     root: import("../context").AlienRoot,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadAlienExpression = (
  { root: { situ } },
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
 *     root: import("../context").AlienRoot,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofAlienExpression = (
  { root: { situ } },
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
 *     root: import("../context").AlienRoot,
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDiscardAlienExpression = (
  { root: { situ } },
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
 *     root: import("../context").AlienRoot,
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteAlienEffect = (
  { mode, root: { situ } },
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
