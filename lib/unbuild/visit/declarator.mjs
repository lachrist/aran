import { StaticSyntaxAranError } from "../../error.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
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
 *   node: estree.VariableDeclarator | { type: "never" },
 *   context: import("./context.d.ts").Context<S>,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildDeclarator = (node, context) => {
  switch (node.type) {
    case "VariableDeclarator": {
      const { serialize, digest } = context;
      const serial = serialize(node);
      const hash = digest(node);
      const init = {
        var: mangleMetaVariable(hash, BASENAME, "init"),
        val:
          node.init == null
            ? makePrimitiveExpression({ undefined: null }, serial)
            : unbuildExpression(node.init, context, null),
      };
      return [
        makeEffectStatement(
          makeWriteEffect(init.var, init.val, serial, true),
          serial,
        ),
        ...unbuildPatternStatement(node.id, context, init.var),
      ];
    }
    default: {
      throw new StaticSyntaxAranError(BASENAME, node);
    }
  }
};
