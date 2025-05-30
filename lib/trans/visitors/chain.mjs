import { AranTypeError } from "../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeCall, makeCallExpression } from "../call.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makeGetMemberExpression, makeGetMember } from "../member.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeIntrinsicExpression, makePrimitiveExpression } from "../node.mjs";
import { transArgumentList } from "./argument.mjs";
import { transChainCallee } from "./callee.mjs";
import { transExpression } from "./expression.mjs";
import { transKey } from "./key.mjs";
import { transChainObject } from "./object.mjs";
import {
  initSyntaxErrorExpression,
  makeConditionPrelude,
} from "../prelude/index.mjs";
import {
  guard,
  bindSequence,
  callSequence__X,
  callSequence___X,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence_X,
  prependSequence,
} from "../../util/index.mjs";
import { makeRegularCallee } from "../callee.mjs";
import { convertKey } from "../key.mjs";
import { optionalizeObject } from "../object.mjs";
import { makeReadVariableExpression } from "../scope/index.mjs";

/**
 * @type {(
 *   site: import("estree-sentry").ChainableExpression<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *     | import("../prelude/index.d.ts").ConditionPrelude
 *   ),
 *   import("../atom.d.ts").Expression
 * >}
 */
export const transChainElement = (node, meta, scope) => {
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
            transChainObject(
              node.object,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
          ),
          liftSequence_X(
            convertKey,
            hash,
            transKey(
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
        transChainCallee(node.callee, forkMeta((meta = nextMeta(meta))), scope),
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
                    transArgumentList(
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
                          transArgumentList(
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
                transArgumentList(
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
      return transExpression(node, meta, scope);
    }
  }
};
