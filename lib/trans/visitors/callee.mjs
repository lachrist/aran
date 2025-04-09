import { makeIntrinsicExpression } from "../node.mjs";
import { transChainObject, transObject } from "./object.mjs";
import { transChainElement } from "./chain.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { transKey } from "./key.mjs";
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
import { transExpression } from "./expression.mjs";
import { resolveChain } from "../prelude/index.mjs";
import {
  makeReadAmbientThisExpression,
  makeReadThisExpression,
} from "../scope/index.mjs";

// We used to have a method to trans callee that return an EffectSequence.
// Returning a ConditionSequence is overkill for callsite in expression visitor.
// But callee can themselves be ChainElements. That requires to transform a
// ConditionSequence<Callee> to a EffectSequence<Callee>. I could not figure
// out how to do that so there is now but a single trans callee.

const getFunction = compileGet("function");

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   object: import("../object.d.ts").Object,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
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
 *   node: import("estree-sentry").MemberExpression<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("../callee.d.ts").RegularCallee,
 * >}
 */
const transMemberCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  return bindTwoSequence(
    bindSequence(
      transObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
      (object) =>
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), object),
    ),
    transKey(
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
 *     | import("estree-sentry").ChainMemberExpression<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").MemberExpression<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *     | import("../prelude/index.d.ts").ConditionPrelude
 *   ),
 *   import("../callee.d.ts").RegularCallee,
 * >}
 */
const transChainMemberCallee = (node, meta, scope) => {
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
        transChainObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
      ),
      (object) =>
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), object),
    ),
    transKey(
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
 *     | import("estree-sentry").Super<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").ChainableExpression<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   (
 *     | import("../prelude/index.d.ts").BodyPrelude
 *     | import("../prelude/index.d.ts").PrefixPrelude
 *     | import("../prelude/index.d.ts").ConditionPrelude
 *   ),
 *   import("../callee.d.ts").Callee,
 * >}
 */
export const transChainCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "ChainExpression") {
    return transChainCallee(node.expression, meta, scope);
  } else if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier") {
    if (node.name === "eval") {
      return zeroSequence(EVAL_CALLEE);
    } else {
      return liftSequenceXX(
        makeRegularCallee,
        transChainElement(node, forkMeta((meta = nextMeta(meta))), scope),
        makeReadAmbientThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { variable: node.name },
        ),
      );
    }
  } else if (node.type === "MemberExpression") {
    return transChainMemberCallee(node, meta, scope);
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      transChainElement(node, meta, scope),
      makeIntrinsicExpression("undefined", hash),
    );
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").Expression<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude | import("../prelude/index.d.ts").PrefixPrelude,
 *   import("../callee.d.ts").Callee
 * >}
 */
export const transCallee = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier") {
    if (node.name === "eval") {
      return zeroSequence(EVAL_CALLEE);
    } else {
      return liftSequenceXX(
        makeRegularCallee,
        transExpression(node, forkMeta((meta = nextMeta(meta))), scope),
        makeReadAmbientThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          { variable: node.name },
        ),
      );
    }
  } else if (node.type === "MemberExpression") {
    return transMemberCallee(node, meta, scope);
  } else if (
    node.type === "ChainExpression" &&
    node.expression.type === "MemberExpression"
  ) {
    const callee = transChainMemberCallee(node.expression, meta, scope);
    return liftSequenceX_(
      makeRegularCallee,
      resolveChain(liftSequenceX(getFunction, callee), hash),
      callee.value.this,
    );
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      transExpression(node, meta, scope),
      makeIntrinsicExpression("undefined", hash),
    );
  }
};
