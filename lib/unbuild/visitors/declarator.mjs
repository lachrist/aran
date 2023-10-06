import { drill } from "../../drill.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeEffectStatement,
  makePrimitiveExpression,
  makeWriteEffect,
} from "../node.mjs";
import { hasInit } from "../predicate.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

const BASENAME = /** @basename */ "declarator";

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.VariableDeclarator,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildDeclarator = ({ node, path }, context) => {
  const { serialize, digest } = context;
  const serial = serialize(node, path);
  const hash = digest(node, path);
  const init = mangleMetaVariable(hash, BASENAME, "init");
  return [
    makeEffectStatement(
      makeWriteEffect(
        init,
        hasInit(node)
          ? unbuildExpression(drill({ node, path }, "init"), context, {
              name:
                node.id.type === "Identifier"
                  ? {
                      type: "static",
                      kind: "scope",
                      base: /** @type {estree.Variable} */ (node.id.name),
                    }
                  : ANONYMOUS,
            })
          : makePrimitiveExpression({ undefined: null }, serial),
        serial,
        true,
      ),
      serial,
    ),
    ...unbuildPatternStatement(drill({ node, path }, "id"), context, init),
  ];
};
