import { getPath } from "../annotate.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeEffectStatement,
  makePrimitiveExpression,
  makeWriteEffect,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

const BASENAME = /** @basename */ "declarator";

/**
 * @type {<S>(
 *   node: estree.VariableDeclarator,
 *   context: import("../context.js").Context<S>,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildDeclarator = (node, context) => {
  const { serialize, digest } = context;
  const serial = serialize(node, context.root, getPath(node));
  const hash = digest(node, context.root, getPath(node));
  const init = mangleMetaVariable(hash, BASENAME, "init");
  return [
    makeEffectStatement(
      makeWriteEffect(
        init,
        node.init == null
          ? makePrimitiveExpression({ undefined: null }, serial)
          : unbuildExpression(node.init, context, {
              name:
                node.id.type === "Identifier"
                  ? {
                      type: "static",
                      kind: "scope",
                      base: /** @type {estree.Variable} */ (node.id.name),
                    }
                  : ANONYMOUS,
            }),
        serial,
        true,
      ),
      serial,
    ),
    ...unbuildPatternStatement(node.id, context, init),
  ];
};
