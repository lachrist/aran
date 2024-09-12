import { AranTypeError } from "../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCall, makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression, makeGetMember } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  callSequence_X,
  callSequence__X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  prependSequence,
} from "../../sequence.mjs";
import { drillSite } from "../site.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import { unbuildChainObject } from "./object.mjs";
import {
  initSyntaxErrorExpression,
  makeConditionPrelude,
} from "../prelude/index.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { guard } from "../../util/index.mjs";
import { makeRegularCallee } from "../callee.mjs";
import { convertKey } from "../key.mjs";
import { optionalizeObject } from "../object.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../atom").Expression
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
          makeGetMember,
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
                return initSyntaxErrorExpression(
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
                          variable:
                            /** @type {import("../../estree").Variable} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeIntrinsicExpression("undefined", path),
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
                          exit: makePrimitiveExpression("undefined", path),
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
