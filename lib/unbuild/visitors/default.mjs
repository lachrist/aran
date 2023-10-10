import { SyntaxAranError } from "../../error.mjs";
import { makeEffectStatement, makeExportEffect } from "../node.mjs";
import { wrapOriginArray } from "../origin.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildStatement } from "./statement.mjs";

/** @type {import("../name.mjs").Name} */
const NAME = {
  type: "static",
  kind: "init",
  base: /** @type {estree.Specifier} */ ("default"),
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.Declaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: null,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildDefault = wrapOriginArray(({ node, path }, context) => {
  switch (node.type) {
    case "VariableDeclaration":
      throw new SyntaxAranError(
        "illegal variable declaration in defauly export",
        node,
      );
    case "FunctionDeclaration":
      return node.id == null
        ? [
            makeEffectStatement(
              makeExportEffect(
                /** @type {estree.Specifier} */ ("default"),
                unbuildFunction(
                  { node, path },
                  {
                    ...context,
                    record: {
                      ...context.record,
                      "super.prototype": ".illegal",
                      "super.constructor": ".illegal",
                    },
                  },
                  {
                    kind: "function",
                    name: NAME,
                  },
                ),
              ),
            ),
          ]
        : unbuildStatement({ node, path }, context, {
            labels: [],
            completion: null,
            loop: { break: null, continue: null },
          });
    case "ClassDeclaration":
      return node.id == null
        ? [
            makeEffectStatement(
              makeExportEffect(
                /** @type {estree.Specifier} */ ("default"),
                unbuildClass({ node, path }, context, {
                  name: NAME,
                }),
              ),
            ),
          ]
        : unbuildStatement({ node, path }, context, {
            labels: [],
            completion: null,
            loop: { break: null, continue: null },
          });
    default:
      return [
        makeEffectStatement(
          makeExportEffect(
            /** @type {estree.Specifier} */ ("default"),
            unbuildExpression({ node, path }, context, {
              name: NAME,
            }),
          ),
        ),
      ];
  }
});
