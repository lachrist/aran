import { AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  bindTwoSequence,
  initSequence,
  prependSequence,
  zeroSequence,
} from "../sequence.mjs";
import { drillSite } from "../site.mjs";
import { makeEarlyErrorExpression, makeEarlyError } from "../early-error.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import { unbuildChainObject } from "./object.mjs";
import { makeConditionPrelude } from "../prelude.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { convertKey } from "../key.mjs";

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   options: {
 *     object: import("../object").Object,
 *   },
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").NodePrelude
 *     | import("../prelude").ChainPrelude
 *   ),
 *   import("../object").Object
 * >}
 */
export const optionalizeObject = ({ path, meta }, { object }) => {
  if (object.type === "super") {
    return makeEarlyError(
      object,
      "Illegal optional member access to super",
      path,
    );
  } else if (object.type === "regular") {
    return bindSequence(cacheConstant(meta, object.data, path), (object) =>
      bindTwoSequence(
        makeBinaryExpression(
          "==",
          makeReadCacheExpression(object, path),
          makePrimitiveExpression(null, path),
          path,
        ),
        makePrimitiveExpression({ undefined: null }, path),
        (test, exit) =>
          initSequence([makeConditionPrelude({ test, exit })], {
            type: "regular",
            data: makeReadCacheExpression(object, path),
          }),
      ),
    );
  } else {
    throw new AranTypeError(object);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").NodePrelude
 *     | import("../prelude").ChainPrelude
 *   ),
 *   aran.Expression<unbuild.Atom>
 * >}
 */
export const unbuildChainElement = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "MemberExpression": {
      return bindTwoSequence(
        bindSequence(
          unbuildChainObject(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
            scope,
            null,
          ),
          (object) => {
            if (node.optional) {
              return optionalizeObject(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                { object },
              );
            } else {
              return zeroSequence(object);
            }
          },
        ),
        unbuildKey(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "property"),
          scope,
          { computed: node.computed },
        ),
        (object, key) =>
          makeGetMemberExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object, key: convertKey({ path }, key) },
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
            switch (callee.type) {
              case "super": {
                return makeEarlyErrorExpression(
                  "Illegal optional call to super",
                  path,
                );
              }
              case "eval": {
                // eval?() is not a direct eval call
                return makeCallExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  {
                    callee: {
                      type: "regular",
                      function: makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable: /** @type {estree.Variable} */ ("eval"),
                        },
                      ),
                      this: makePrimitiveExpression({ undefined: null }, path),
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
                );
              }
              case "regular": {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    callee.function,
                    path,
                  ),
                  (function_) =>
                    bindTwoSequence(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(function_, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      makePrimitiveExpression({ undefined: null }, path),
                      (test, exit) =>
                        prependSequence(
                          [makeConditionPrelude({ test, exit })],
                          makeCallExpression(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            scope,
                            {
                              callee: {
                                type: "regular",
                                function: makeReadCacheExpression(
                                  function_,
                                  path,
                                ),
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
                    ),
                );
              }
              default: {
                throw new AranTypeError(callee);
              }
            }
          } else {
            return makeCallExpression(
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
            );
          }
        },
      );
    }
    default: {
      return unbuildExpression({ node, path, meta }, scope, null);
    }
  }
};
