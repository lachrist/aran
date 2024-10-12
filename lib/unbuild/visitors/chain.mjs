import { AranTypeError } from "../../report.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCall, makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression, makeGetMember } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import {
  bindSequence,
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
import { guard } from "../../util/index.mjs";
import { makeRegularCallee } from "../callee.mjs";
import { convertKey } from "../key.mjs";
import { optionalizeObject } from "../object.mjs";
import { makeReadVariableExpression } from "../scope/index.mjs";

/**
 * @type {(
 *   site: import("estree-sentry").ChainableExpression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../atom").Expression
 * >}
 */
export const unbuildChainElement = (node, meta, scope) => {
  const { _hash: hash } = node;
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
              callSequence__X(
                optionalizeObject,
                hash,
                forkMeta((meta = nextMeta(meta))),
                object,
              ),
            unbuildChainObject(
              node.object,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
          ),
          liftSequence_X(
            convertKey,
            hash,
            unbuildKey(
              node.property,
              forkMeta((meta = nextMeta(meta))),
              scope,
              node.computed,
            ),
          ),
        ),
      );
    }
    case "CallExpression": {
      return bindSequence(
        unbuildChainCallee(
          node.callee,
          forkMeta((meta = nextMeta(meta))),
          scope,
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
                return callSequence___X(
                  makeCallExpression,
                  hash,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  liftSequenceXX(
                    makeCall,
                    liftSequenceX_(
                      makeRegularCallee,
                      makeReadVariableExpression(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        {
                          variable:
                            /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                        },
                      ),
                      makeIntrinsicExpression("undefined", hash),
                    ),
                    unbuildArgumentList(
                      node.arguments,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      hash,
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
                      callSequence___X(
                        makeCallExpression,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        liftSequence_X(
                          makeCall,
                          makeRegularCallee(
                            makeReadCacheExpression(function_, hash),
                            callee.this,
                          ),
                          unbuildArgumentList(
                            node.arguments,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            hash,
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
            return callSequence___X(
              makeCallExpression,
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              liftSequence_X(
                makeCall,
                callee,
                unbuildArgumentList(
                  node.arguments,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  hash,
                ),
              ),
            );
          }
        },
      );
    }
    default: {
      return unbuildExpression(node, meta, scope);
    }
  }
};
