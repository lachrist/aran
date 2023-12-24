import { AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  initSequence,
  makeCondition,
  makeEffectCondition,
  mapSequence,
  passSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite } from "../site.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainMember } from "./member.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence.d.ts").ConditionSequence<
 *   aran.Expression<unbuild.Atom>
 * >}
 */
export const unbuildChainElement = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "MemberExpression": {
      return mapSequence(
        unbuildChainMember({ node, path, meta }, scope, null),
        ({ member }) => member,
      );
    }
    case "CallExpression": {
      return bindSequence(
        unbuildCallee(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "callee"),
          scope,
          null,
        ),
        (callee) => {
          if (node.optional) {
            if (callee.type === "super") {
              return zeroSequence(
                makeSyntaxErrorExpression(
                  "Illegal optional call to super",
                  path,
                ),
              );
            } else if (callee.type === "regular") {
              return bindSequence(
                passSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    callee.function,
                    path,
                  ),
                  makeEffectCondition,
                ),
                (function_) =>
                  initSequence(
                    [
                      makeCondition(
                        makeBinaryExpression(
                          "==",
                          makeReadCacheExpression(function_, path),
                          makePrimitiveExpression(null, path),
                          path,
                        ),
                        makePrimitiveExpression({ undefined: null }, path),
                      ),
                    ],
                    makeCallExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        callee: {
                          type: "regular",
                          function: makeReadCacheExpression(function_, path),
                          this: callee.this,
                        },
                        argument_list: unbuildArgumentList(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "arguments",
                          ),
                          scope,
                          null,
                        ),
                      },
                    ),
                  ),
              );
            } else {
              throw new AranTypeError("invalid callee", callee);
            }
          } else {
            return zeroSequence(
              makeCallExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  callee,
                  argument_list: unbuildArgumentList(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "arguments",
                    ),
                    scope,
                    null,
                  ),
                },
              ),
            );
          }
        },
      );
    }
    default: {
      return zeroSequence(unbuildExpression({ node, path, meta }, scope, null));
    }
  }
};
