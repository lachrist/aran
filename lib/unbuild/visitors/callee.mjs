import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildChainObject, unbuildObject } from "./object.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildKey } from "./key.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import { convertKey } from "../key.mjs";
import { duplicateObject, optionalizeObject } from "../object.mjs";
import { EVAL_CALLEE, SUPER_CALLEE, makeRegularCallee } from "../callee.mjs";
import {
  compileGet,
  guard,
  bindSequence,
  bindTwoSequence,
  callSequence__X,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  zeroSequence,
} from "../../util/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { resolveChain } from "../prelude/index.mjs";
import {
  makeReadAmbientThisExpression,
  makeReadThisExpression,
} from "../scope/index.mjs";

// We used to have a method to unbuild callee that return an EffectSequence.
// Returning a ConditionSequence is overkill for callsite in expression visitor.
// But callee can themselves be ChainElements. That requires to transform a
// ConditionSequence<Callee> to a EffectSequence<Callee>. I could not figure
// out how to do that so there is now but a single unbuild callee.

const getFunction = compileGet("function");

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   object: import("../object").Object,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeThisExpression = (hash, meta, scope, object) => {
  if (object.type === "super") {
    return makeReadThisExpression(hash, meta, scope, {});
  } else if (object.type === "regular") {
    return zeroSequence(object.data);
  } else {
    throw new AranTypeError(object);
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").MemberExpression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../callee").RegularCallee,
 * >}
 */
const unbuildMemberCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  return bindTwoSequence(
    bindSequence(
      unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
      (object) =>
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), object),
    ),
    unbuildKey(
      node.property,
      forkMeta((meta = nextMeta(meta))),
      scope,
      node.computed,
    ),
    ([object1, object2], key) =>
      liftSequenceXX(
        makeRegularCallee,
        makeGetMemberExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { object: object1, key: convertKey(hash, key) },
        ),
        makeThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          object2,
        ),
      ),
  );
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").ChainMemberExpression<import("../../hash").HashProp>
 *     | import("estree-sentry").MemberExpression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../callee").RegularCallee,
 * >}
 */
const unbuildChainMemberCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  return bindTwoSequence(
    bindSequence(
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
      (object) =>
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), object),
    ),
    unbuildKey(
      node.property,
      forkMeta((meta = nextMeta(meta))),
      scope,
      node.computed,
    ),
    ([object1, object2], key) =>
      liftSequenceXX(
        makeRegularCallee,
        makeGetMemberExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          {
            object: object1,
            key: convertKey(hash, key),
          },
        ),
        makeThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          object2,
        ),
      ),
  );
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../../hash").HashProp>
 *     | import("estree-sentry").ChainableExpression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../callee").Callee,
 * >}
 */
export const unbuildChainCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "ChainExpression") {
    return unbuildChainCallee(node.expression, meta, scope);
  } else if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier") {
    if (node.name === "eval") {
      return zeroSequence(EVAL_CALLEE);
    } else {
      return liftSequenceXX(
        makeRegularCallee,
        unbuildChainElement(node, forkMeta((meta = nextMeta(meta))), scope),
        makeReadAmbientThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { variable: node.name },
        ),
      );
    }
  } else if (node.type === "MemberExpression") {
    return unbuildChainMemberCallee(node, meta, scope);
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildChainElement(node, meta, scope),
      makeIntrinsicExpression("undefined", hash),
    );
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude | import("../prelude").PrefixPrelude,
 *   import("../callee").Callee
 * >}
 */
export const unbuildCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier") {
    if (node.name === "eval") {
      return zeroSequence(EVAL_CALLEE);
    } else {
      return liftSequenceXX(
        makeRegularCallee,
        unbuildExpression(node, forkMeta((meta = nextMeta(meta))), scope),
        makeReadAmbientThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { variable: node.name },
        ),
      );
    }
  } else if (node.type === "MemberExpression") {
    return unbuildMemberCallee(node, meta, scope);
  } else if (
    node.type === "ChainExpression" &&
    node.expression.type === "MemberExpression"
  ) {
    const callee = unbuildChainMemberCallee(node.expression, meta, scope);
    return liftSequenceX_(
      makeRegularCallee,
      resolveChain(liftSequenceX(getFunction, callee), hash),
      callee.value.this,
    );
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildExpression(node, meta, scope),
      makeIntrinsicExpression("undefined", hash),
    );
  }
};
