import { AranTypeError } from "../../error.mjs";
import { mapObject } from "../../util/index.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeConditionalExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { drill, drillArray } from "../site.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainMember } from "./member.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     kontinue: (
 *       context: import("../context.d.ts").Context,
 *       options: {
 *         result: aran.Expression<unbuild.Atom>,
 *       },
 *     ) => aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildChainElement = (
  { node, path, meta },
  context,
  { kontinue },
) => {
  switch (node.type) {
    case "MemberExpression": {
      return unbuildChainMember({ node, path, meta }, context, {
        object: false,
        kontinue: (context, { member: result }) =>
          kontinue(context, { result }),
      });
    }
    case "CallExpression": {
      const metas = splitMeta(meta, ["drill", "arguments", "function", "call"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["callee", "arguments"]),
        "arguments",
        drillArray,
      );
      // Optional eval call is not direct
      return unbuildChainCallee(sites.callee, context, {
        kontinue: (context, { callee }) => {
          if (node.optional) {
            switch (callee.type) {
              case "super": {
                return makeSyntaxErrorExpression(
                  "Illegal optional call to super",
                  path,
                );
              }
              case "normal": {
                return makeInitCacheExpression(
                  "constant",
                  callee.function,
                  {
                    path,
                    meta: metas.function,
                  },
                  (function_) =>
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(function_, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      makePrimitiveExpression({ undefined: null }, path),
                      unbuildArgumentList(sites.arguments, context, {
                        path,
                        kontinue: (context, { argument_list }) =>
                          makeCallExpression(
                            { path, meta: metas.call },
                            context,
                            {
                              callee: {
                                type: "normal",
                                function: makeReadCacheExpression(
                                  function_,
                                  path,
                                ),
                                this: callee.this,
                              },
                              argument_list,
                            },
                          ),
                      }),
                      path,
                    ),
                );
              }
              default: {
                throw new AranTypeError("invalid callee", callee);
              }
            }
          } else {
            return unbuildArgumentList(sites.arguments, context, {
              path,
              kontinue: (context, { argument_list }) =>
                makeCallExpression({ path, meta: metas.call }, context, {
                  callee,
                  argument_list,
                }),
            });
          }
        },
      });
    }
    default: {
      return kontinue(context, {
        result: unbuildExpression({ node, path, meta }, context, {}),
      });
    }
  }
};
