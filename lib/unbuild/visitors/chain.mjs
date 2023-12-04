import { AranTypeError } from "../../error.mjs";
import { mapObject } from "../../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  initSequence,
  mapSequence,
  passSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drill, drillArray } from "../site.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainMember } from "./member.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Expression>,
 *   context: import("../context.d.ts").Context,
 *   options: {},
 * ) => import("../sequence.d.ts").ConditionSequence<
 *   aran.Expression<unbuild.Atom>
 * >}
 */
export const unbuildChainElement = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "MemberExpression": {
      return mapSequence(
        unbuildChainMember({ node, path, meta }, context, { object: false }),
        ({ member }) => member,
      );
    }
    case "CallExpression": {
      const metas = splitMeta(meta, ["drill", "arguments", "function", "call"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["callee", "arguments"]),
        "arguments",
        drillArray,
      );
      // Optional eval call is not direct
      return bindSequence(
        unbuildCallee(sites.callee, context, {}),
        (callee) => {
          if (node.optional) {
            switch (callee.type) {
              case "super": {
                return zeroSequence(
                  makeSyntaxErrorExpression(
                    "Illegal optional call to super",
                    path,
                  ),
                );
              }
              case "normal": {
                return bindSequence(
                  passSequence(
                    cacheConstant(metas.function, callee.function, path),
                    (node) => ({ type: "effect", node }),
                  ),
                  (function_) =>
                    initSequence(
                      [
                        /** @type {import("../sequence.js").Condition} */ ({
                          type: "condition",
                          test: makeBinaryExpression(
                            "==",
                            makeReadCacheExpression(function_, path),
                            makePrimitiveExpression(null, path),
                            path,
                          ),
                          exit: makePrimitiveExpression(
                            { undefined: null },
                            path,
                          ),
                        }),
                      ],
                      makeCallExpression({ path, meta: metas.call }, context, {
                        callee: {
                          type: "normal",
                          function: makeReadCacheExpression(function_, path),
                          this: callee.this,
                        },
                        argument_list: unbuildArgumentList(
                          sites.arguments,
                          context,
                          { path },
                        ),
                      }),
                    ),
                );
              }
              default: {
                throw new AranTypeError("invalid callee", callee);
              }
            }
          } else {
            return zeroSequence(
              makeCallExpression({ path, meta: metas.call }, context, {
                callee,
                argument_list: unbuildArgumentList(sites.arguments, context, {
                  path,
                }),
              }),
            );
          }
        },
      );
    }
    default: {
      return zeroSequence(unbuildExpression({ node, path, meta }, context, {}));
    }
  }
};
