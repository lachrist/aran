import {
  STRICT_KEYWORD_RECORD,
  STRICT_READONLY_RECORD,
} from "../../estree.mjs";
import { guard, hasOwn } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  report,
  makeApplyExpression,
  makeDeclareGlobalStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadGlobalExpression,
  makeReadParameterExpression,
  makeTypeofGlobalExpression,
  makeWriteGlobalEffect,
} from "../node.mjs";

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write",
 *   variable: estree.Variable,
 *   makeNode: (variable: estree.Variable) => N,
 * ) => N}
 */
const sanitizeExternalVariable = (mode, operation, variable, makeNode) => {
  switch (mode) {
    case "strict": {
      return makeNode(variable);
    }
    case "sloppy": {
      if (hasOwn(STRICT_KEYWORD_RECORD, variable)) {
        return report(
          makeNode(/** @type {estree.Variable} */ (`${variable}_`)),
          {
            name: "StrictKeywordExternalVariable",
            message: `Replacing strict keyword external variable '${variable}' by '${variable}_'`,
          },
        );
      } else {
        switch (operation) {
          case "read": {
            return makeNode(variable);
          }
          case "write": {
            if (hasOwn(STRICT_READONLY_RECORD, variable)) {
              return report(
                makeNode(/** @type {estree.Variable} */ (`${variable}_`)),
                {
                  name: "StrictReadonlyExternalVariableWrite",
                  message: `Replacing strict readonly external variable '${variable}' by '${variable}_'`,
                },
              );
            } else {
              return makeNode(variable);
            }
          }
          default: {
            throw new AranTypeError("invalid operation", operation);
          }
        }
      }
    }
    default: {
      throw new AranTypeError("invalid mode", mode);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "global",
 *     kind: "let" | "var",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listDeclareAlienStatement = (
  { path },
  context,
  { kind, variable },
) => [
  sanitizeExternalVariable(context.mode, "write", variable, (variable) =>
    makeDeclareGlobalStatement(kind, variable, path),
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadAlienExpression = (
  { path },
  context,
  { situ, variable },
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.read", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          sanitizeExternalVariable(context.mode, "read", variable, (variable) =>
            makePrimitiveExpression(variable, path),
          ),
        ],
        path,
      );
    }
    case "global": {
      return sanitizeExternalVariable(
        context.mode,
        "read",
        variable,
        (variable) => makeReadGlobalExpression(variable, path),
      );
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "global" | "local",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofAlienExpression = (
  { path },
  context,
  { situ, variable },
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.typeof", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          sanitizeExternalVariable(context.mode, "read", variable, (variable) =>
            makePrimitiveExpression(variable, path),
          ),
        ],
        path,
      );
    }
    case "global": {
      return sanitizeExternalVariable(
        context.mode,
        "read",
        variable,
        (variable) => makeTypeofGlobalExpression(variable, path),
      );
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     situ: "global" | "local",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDiscardAlienExpression = ({ path }, _context, { variable }) =>
  // It makes more sense to return false rather then true.
  // Because we <<failed>> to discard the variable.
  //
  report(makePrimitiveExpression(false, path), {
    name: "ExternalVariableDelete",
    message: `Ignoring delete of external variable '${variable}'`,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "global" | "local",
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteAlienEffect = (
  { path },
  context,
  { situ, variable, right },
) => {
  /** @type {Omit<unbuild.Log, "path">} */
  const log = {
    name: "SloppyExternalVariableWrite",
    message: `Converting write to external variable '${variable}' from sloppy to strict`,
  };
  switch (situ) {
    case "local": {
      return [
        guard(
          context.mode === "sloppy",
          (node) => report(node, log),
          makeExpressionEffect(
            makeApplyExpression(
              makeReadParameterExpression("scope.write", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                sanitizeExternalVariable(
                  context.mode,
                  "write",
                  variable,
                  (variable) => makePrimitiveExpression(variable, path),
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
          context.mode === "sloppy",
          (node) => report(node, log),
          sanitizeExternalVariable(
            context.mode,
            "write",
            variable,
            (variable) => makeWriteGlobalEffect(variable, right, path),
          ),
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid context.param.situ", situ);
    }
  }
};
