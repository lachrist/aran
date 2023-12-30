import { AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeExpressionEffect, makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  initSequence,
  makeCondition,
  makeEffectCondition,
  mapTwoSequence,
  passSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite } from "../site.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import { unbuildChainObject } from "./object.mjs";

/**
 * @type {(
 *   site: import("../site").VoidSite,
 *   options: {
 *     object: import("./object").Object,
 *   },
 * ) => import("../sequence").Condition[]}
 */
export const optionalizeObject = ({ path }, { object }) => {
  if (object.type === "super") {
    return [
      makeEffectCondition(
        makeExpressionEffect(
          makeEarlyErrorExpression(
            "Illegal optional member access to super",
            path,
          ),
          path,
        ),
      ),
    ];
  } else if (object.type === "regular") {
    return [
      makeCondition(
        makeBinaryExpression(
          "==",
          makeReadCacheExpression(object.data, path),
          makePrimitiveExpression(null, path),
          path,
        ),
        makePrimitiveExpression({ undefined: null }, path),
      ),
    ];
  } else {
    throw new AranTypeError("invalid object", object);
  }
};

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
      return mapTwoSequence(
        bindSequence(
          unbuildChainObject(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
            scope,
            null,
          ),
          (object) => {
            if (node.optional) {
              return initSequence(
                optionalizeObject({ path }, { object }),
                object,
              );
            } else {
              return zeroSequence(object);
            }
          },
        ),
        passSequence(
          unbuildKey(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "property",
            ),
            scope,
            { computed: node.computed },
          ),
          makeEffectCondition,
        ),
        (object, key) =>
          makeGetMemberExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object, key },
          ),
      );
    }
    case "CallExpression": {
      return bindSequence(
        unbuildChainCallee(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "callee"),
          scope,
          null,
        ),
        (callee) => {
          if (node.optional) {
            if (callee.type === "super") {
              return zeroSequence(
                makeEarlyErrorExpression(
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
