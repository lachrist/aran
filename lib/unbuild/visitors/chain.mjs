import { AranTypeError } from "../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCallContext, makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression, makeGetMemberContext } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
  callSequence_X,
  liftSequenceX_,
  liftSequence_X,
  liftSequence_XX,
  liftSequence__XX,
  liftSequence___X,
  prependSequence,
} from "../../sequence.mjs";
import { drillSite } from "../site.mjs";
import { unbuildArgumentList } from "./argument.mjs";
import { unbuildChainCallee } from "./callee.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import { unbuildChainObject } from "./object.mjs";
import {
  initErrorExpression,
  makeConditionPrelude,
} from "../prelude/index.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { guard } from "../../util/index.mjs";
import { makeRegularCallee } from "../callee.mjs";
import { convertKey } from "../key.mjs";
import { optionalizeObject } from "../object.mjs";
import { lookupDeadzone } from "../deadzone.mjs";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Expression>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *   },
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../atom").Expression
 * >}
 */
export const unbuildChainElement = (
  { node, path, meta },
  { scope, deadzone },
) => {
  switch (node.type) {
    case "MemberExpression": {
      return callSequence_X(
        makeGetMemberExpression,
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        liftSequence_XX(
          makeGetMemberContext,
          scope,
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
              { scope, deadzone },
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
              { scope, deadzone, computed: node.computed },
            ),
          ),
        ),
      );
    }
    case "CallExpression": {
      return bindSequence(
        unbuildChainCallee(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "callee"),
          { scope, deadzone },
        ),
        (callee) => {
          if (node.optional) {
            switch (callee.type) {
              case "super": {
                return initErrorExpression(
                  "Illegal optional call to super",
                  path,
                );
              }
              case "eval": {
                // eval?() is not a direct eval call
                return callSequence_X(
                  makeCallExpression,
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  liftSequence__XX(
                    makeCallContext,
                    scope,
                    deadzone,
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
                          status: lookupDeadzone(
                            deadzone,
                            /** @type {import("../../estree").Variable} */ (
                              "eval"
                            ),
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
                      { scope, deadzone },
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
                      callSequence_X(
                        makeCallExpression,
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        liftSequence___X(
                          makeCallContext,
                          scope,
                          deadzone,
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
                            { scope, deadzone },
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
                { scope, deadzone },
              ),
              (argument_list) =>
                makeCallExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  {
                    scope,
                    deadzone,
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
      return unbuildExpression({ node, path, meta }, { scope, deadzone });
    }
  }
};
