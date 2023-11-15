import { STRICT_KEYWORD_RECORD } from "../../estree.mjs";
import { AranTypeError, guard, hasOwn } from "../../util/index.mjs";
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
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   mode: "strict" | "sloppy",
 *   variable: estree.Variable,
 *   makeNode: (variable: estree.Variable) => N,
 * ) => N}
 */
export const sanitizeExternalVariable = (mode, variable, makeNode) => {
  switch (mode) {
    case "strict": {
      return makeNode(variable);
    }
    case "sloppy": {
      if (hasOwn(STRICT_KEYWORD_RECORD, variable)) {
        return logEnclaveLimitation(
          makeNode(/** @type {estree.Variable} */ (`${variable}_`)),
          `Replacing external variable '${variable}' by '${variable}_'`,
        );
      } else {
        return makeNode(variable);
      }
    }
    default: {
      throw new AranTypeError("invalid mode", mode);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../program.js").RootProgram
 *       & import("../program.js").GlobalProgram
 *       & import("../program.js").AlienProgram
 *     ),
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
  { mode },
  kind,
  variable,
  right,
  { path },
) => [
  sanitizeExternalVariable(mode, variable, (variable) =>
    makeDeclareGlobalStatement(kind, variable, right, path),
  ),
];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../program.js").RootProgram
 *       & import("../program.js").AlienProgram
 *     ),
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadAlienExpression = (
  { mode, root: { situ } },
  variable,
  { path },
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.read", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          sanitizeExternalVariable(mode, variable, (variable) =>
            makePrimitiveExpression(variable, path),
          ),
        ],
        path,
      );
    }
    case "global": {
      return sanitizeExternalVariable(mode, variable, (variable) =>
        makeReadGlobalExpression(variable, path),
      );
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../program.js").RootProgram
 *       & import("../program.js").AlienProgram
 *     ),
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofAlienExpression = (
  { mode, root: { situ } },
  variable,
  { path },
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.typeof", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          sanitizeExternalVariable(mode, variable, (variable) =>
            makePrimitiveExpression(variable, path),
          ),
        ],
        path,
      );
    }
    case "global": {
      return sanitizeExternalVariable(mode, variable, (variable) =>
        makeTypeofGlobalExpression(variable, path),
      );
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     root: (
 *       & import("../program.js").RootProgram
 *       & import("../program.js").AlienProgram
 *     ),
 *   },
 *   variable: estree.Variable,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDiscardAlienExpression = (_context, variable, { path }) =>
  logEnclaveLimitation(
    makePrimitiveExpression(false, path),
    `Ignoring discard of external variable '${variable}'`,
  );

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../program.js").RootProgram
 *       & import("../program.js").AlienProgram
 *     ),
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
  const message = `Converting write to external variable '${variable}' from sloppy to strict`;
  switch (situ) {
    case "local": {
      return [
        guard(
          mode === "sloppy",
          (node) => logEnclaveLimitation(node, message),
          makeExpressionEffect(
            makeApplyExpression(
              makeReadParameterExpression("scope.write", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                sanitizeExternalVariable(mode, variable, (variable) =>
                  makePrimitiveExpression(variable, path),
                ),
                right,
              ],
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
          (node) => logEnclaveLimitation(node, message),
          sanitizeExternalVariable(mode, variable, (variable) =>
            makeWriteGlobalEffect(variable, right, path),
          ),
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};
