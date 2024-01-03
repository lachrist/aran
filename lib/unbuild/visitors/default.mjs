import { makeEffectStatement, makeExportEffect } from "../node.mjs";
import { DEFAULT_SPECIFIER } from "../query/index.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Expression | estree.Declaration>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence.js").StatementSequence}
 */
export const unbuildDefault = ({ node, path, meta }, scope, _options) => {
  if (
    node.type === "VariableDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return unbuildStatement({ node, path, meta }, scope, {
      labels: [],
      completion: null,
      loop: { break: null, continue: null },
    });
  } else {
    return [
      makeEffectStatement(
        makeExportEffect(
          DEFAULT_SPECIFIER,
          unbuildNameExpression({ node, path, meta }, scope, {
            name: { type: "default" },
          }),
          path,
        ),
        path,
      ),
    ];
  }
};
