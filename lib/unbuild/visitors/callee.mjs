import { makePrimitiveExpression } from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeReadThisExpression } from "../param/index.mjs";
import { unbuildChainMember, unbuildMember } from "./member.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { isNotOptionalMemberExpression } from "../predicate.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { drill } from "../site.mjs";

/**
 * @typedef {{
 *   type: "super",
 * } | {
 *   type: "normal",
 *   function: aran.Expression<unbuild.Atom>,
 *   this: aran.Expression<unbuild.Atom>,
 * }} Callee
 */

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         callee: Callee,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 *  ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildChainCallee = (
  { node, path, meta },
  context,
  { kontinue },
) => {
  switch (node.type) {
    case "Super": {
      return kontinue(context, { callee: { type: "super" } });
    }
    case "ChainExpression": {
      // Not sure if nested chain expression are legal.
      // But it is easy to support here.
      return unbuildChainCallee(
        drill({ node, path, meta }, ["expression"]).expression,
        context,
        { kontinue },
      );
    }
    case "MemberExpression": {
      return unbuildChainMember({ node, path, meta }, context, {
        object: true,
        kontinue: (context, { object, member }) =>
          kontinue(context, {
            callee: {
              type: "normal",
              function: member,
              this:
                object === "super"
                  ? makeReadThisExpression({ path }, context)
                  : object,
            },
          }),
      });
    }
    default: {
      return unbuildChainElement({ node, path, meta }, context, {
        kontinue: (context, { result }) =>
          kontinue(context, {
            callee: {
              type: "normal",
              function: result,
              this: makePrimitiveExpression({ undefined: null }, path),
            },
          }),
      });
    }
  }
};

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         callee: Callee,
 *       },
 *     ) => aran.Expression<unbuild.Atom>
 *   },
 *  ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildCallee = ({ node, path, meta }, context, { kontinue }) => {
  switch (node.type) {
    case "Super": {
      return kontinue(context, { callee: { type: "super" } });
    }
    case "ChainExpression": {
      // Not sure if chain expressions in callee are legal.
      // But it is easy to support here.
      return unbuildChainCallee(
        drill({ node, path, meta }, ["expression"]).expression,
        context,
        { kontinue },
      );
    }
    case "MemberExpression": {
      if (isNotOptionalMemberExpression(node)) {
        return unbuildMember({ node, path, meta }, context, {
          object: true,
          kontinue: (context, { object, member }) =>
            kontinue(context, {
              callee: {
                type: "normal",
                function: member,
                this:
                  object === "super"
                    ? makeReadThisExpression({ path }, context)
                    : object,
              },
            }),
        });
      } else {
        return makeSyntaxErrorExpression(
          "Illegal optional member outside of chain expression",
          path,
        );
      }
    }
    default: {
      return kontinue(context, {
        callee: {
          type: "normal",
          function: unbuildExpression({ node, path, meta }, context, {}),
          this: makePrimitiveExpression({ undefined: null }, path),
        },
      });
    }
  }
};
