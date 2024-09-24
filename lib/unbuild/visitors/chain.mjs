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
  callSequence___X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  prependSequence,
} from "../../sequence.mjs";
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
import { digest } from "../annotation/index.mjs";

/**
 * @type {(
 *   site: import("../../estree").Expression,
 *   meta: import("../meta").Meta,
 *   context: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
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
export const unbuildChainElement = (node, meta, { scope, annotation }) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "MemberExpression": {
      return callSequence___X(
        makeGetMemberExpression,
        hash,
        forkMeta((meta = nextMeta(meta))),
        scope,
        liftSequenceXX(
          makeGetMember,
          guard(
            node.optional,
            (object) =>
              callSequence_X(
                optionalizeObject,
                { hash, meta: forkMeta((meta = nextMeta(meta))) },
                object,
              ),
            unbuildChainObject(
              node.object,
              forkMeta((meta = nextMeta(meta))),
              scope,
              null,
            ),
          ),
          liftSequence_X(
            convertKey,
            { hash },
            unbuildKey(node.property, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
              computed: node.computed,
            }),
          ),
        ),
      );
    }
    case "CallExpression": {
      return bindSequence(
        unbuildChainCallee(
          drillSite(node, hash, forkMeta((meta = nextMeta(meta))), "callee"),
          scope,
          null,
        ),
        (callee) => {
          if (node.optional) {
            switch (callee.type) {
              case "super": {
                return initSyntaxErrorExpression(
                  "Illegal optional call to super",
                  hash,
                );
              }
              case "eval": {
                // eval?() is not a direct eval call
                return callSequence__X(
                  makeCallExpression,
                  { hash, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  liftSequenceXX(
                    makeCall,
                    liftSequenceX_(
                      makeRegularCallee,
                      makeScopeLoadExpression(
                        { hash, meta: forkMeta((meta = nextMeta(meta))) },
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
                      makeIntrinsicExpression("undefined", hash),
                    ),
                    unbuildArgumentList(
                      drillSite(
                        node,
                        hash,
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
                    hash,
                  ),
                  (function_) =>
                    prependSequence(
                      [
                        makeConditionPrelude({
                          test: makeBinaryExpression(
                            "==",
                            makeReadCacheExpression(function_, hash),
                            makePrimitiveExpression(null, hash),
                            hash,
                          ),
                          exit: makePrimitiveExpression("undefined", hash),
                        }),
                      ],
                      callSequence__X(
                        makeCallExpression,
                        { hash, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        liftSequence_X(
                          makeCall,
                          makeRegularCallee(
                            makeReadCacheExpression(function_, hash),
                            callee.this,
                          ),
                          unbuildArgumentList(
                            drillSite(
                              node,
                              hash,
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
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  "arguments",
                ),
                scope,
                null,
              ),
              (argument_list) =>
                makeCallExpression(
                  { hash, meta: forkMeta((meta = nextMeta(meta))) },
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
      return unbuildExpression({ node, hash, meta }, scope, null);
    }
  }
};
