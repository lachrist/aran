import { AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCall, makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression, makeMember } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  callSequence_X,
  callSequence__X,
  initSequence,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  prependSequence,
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
import { guard } from "../../util/index.mjs";
import { makeRegularCallee } from "../callee.mjs";
import { convertKey } from "../key.mjs";

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   object: import("../object").Object,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../object").Object
 * >}
 */
export const optionalizeObject = ({ path, meta }, object) => {
  if (object.type === "super") {
    return makeEarlyError(
      object,
      "Illegal optional member access to super",
      path,
    );
  } else if (object.type === "regular") {
    return bindSequence(cacheConstant(meta, object.data, path), (object) =>
      initSequence(
        [
          makeConditionPrelude({
            test: makeBinaryExpression(
              "==",
              makeReadCacheExpression(object, path),
              makePrimitiveExpression(null, path),
              path,
            ),
            exit: makePrimitiveExpression({ undefined: null }, path),
          }),
        ],
        {
          type: "regular",
          data: makeReadCacheExpression(object, path),
        },
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
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   aran.Expression<unbuild.Atom>
 * >}
 */
export const unbuildChainElement = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "MemberExpression": {
      return callSequence__X(
        makeGetMemberExpression,
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        liftSequenceXX(
          makeMember,
          guard(
            node.optional,
            (object) =>
              callSequence_X(
                optionalizeObject,
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                object,
              ),
            unbuildChainObject(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "object",
              ),
              scope,
              null,
            ),
          ),
          liftSequence_X(
            convertKey,
            { path },
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
          ),
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
                return callSequence__X(
                  makeCallExpression,
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  liftSequenceXX(
                    makeCall,
                    liftSequenceX_(
                      makeRegularCallee,
                      makeScopeLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "read",
                          mode: getMode(scope),
                          variable: /** @type {estree.Variable} */ ("eval"),
                        },
                      ),
                      makePrimitiveExpression({ undefined: null }, path),
                    ),
                    unbuildArgumentList(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "arguments",
                      ),
                      scope,
                      null,
                    ),
                  ),
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
                    prependSequence(
                      [
                        makeConditionPrelude({
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
                      callSequence__X(
                        makeCallExpression,
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        liftSequence_X(
                          makeCall,
                          makeRegularCallee(
                            makeReadCacheExpression(function_, path),
                            callee.this,
                          ),
                          unbuildArgumentList(
                            drillSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "arguments",
                            ),
                            scope,
                            null,
                          ),
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
            return bindSequence(
              unbuildArgumentList(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "arguments",
                ),
                scope,
                null,
              ),
              (argument_list) =>
                makeCallExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  {
                    callee,
                    argument_list,
                  },
                ),
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
