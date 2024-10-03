import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildChainObject, unbuildObject } from "./object.mjs";
import { unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  bindTwoSequence,
  callSequence__X,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";
import { makeScopeLoadExpression } from "../scope/index.mjs";
import { AranTypeError } from "../../report.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildKey } from "./key.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import { convertKey } from "../key.mjs";
import { duplicateObject, optionalizeObject } from "../object.mjs";
import { EVAL_CALLEE, SUPER_CALLEE, makeRegularCallee } from "../callee.mjs";
import { compileGet, guard } from "../../util/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { resolveChain } from "../prelude/index.mjs";

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
 *   context: import("../context").Context,
 *   object: import("../object").Object,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeThisExpression = (hash, meta, context, object) => {
  if (object.type === "super") {
    return makeScopeLoadExpression(hash, meta, context.scope, {
      type: "read-this",
      mode: context.mode,
    });
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
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../callee").RegularCallee,
 * >}
 */
const unbuildMemberCallee = (node, meta, context) => {
  const { _hash: hash } = node;
  return bindTwoSequence(
    bindSequence(
      unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), context),
      (object) =>
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), object),
    ),
    unbuildKey(
      node.property,
      forkMeta((meta = nextMeta(meta))),
      context,
      node.computed,
    ),
    ([object1, object2], key) =>
      liftSequenceXX(
        makeRegularCallee,
        makeGetMemberExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          context.scope,
          { mode: context.mode, object: object1, key: convertKey(hash, key) },
        ),
        makeThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          context,
          object2,
        ),
      ),
  );
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").OptionalMemberExpression<import("../../hash").HashProp>
 *     | import("estree-sentry").MemberExpression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../callee").RegularCallee,
 * >}
 */
const unbuildChainMemberCallee = (node, meta, context) => {
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
          context,
        ),
      ),
      (object) =>
        duplicateObject(hash, forkMeta((meta = nextMeta(meta))), object),
    ),
    unbuildKey(
      node.property,
      forkMeta((meta = nextMeta(meta))),
      context,
      node.computed,
    ),
    ([object1, object2], key) =>
      liftSequenceXX(
        makeRegularCallee,
        makeGetMemberExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          context.scope,
          {
            mode: context.mode,
            object: object1,
            key: convertKey(hash, key),
          },
        ),
        makeThisExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          context,
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
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../callee").Callee,
 * >}
 */
export const unbuildChainCallee = (node, meta, context) => {
  const { _hash: hash } = node;
  if (node.type === "ChainExpression") {
    return unbuildChainCallee(node.expression, meta, context);
  } else if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier") {
    if (node.name === "eval") {
      return zeroSequence(EVAL_CALLEE);
    } else {
      return liftSequenceXX(
        makeRegularCallee,
        unbuildChainElement(node, forkMeta((meta = nextMeta(meta))), context),
        makeScopeLoadExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          context.scope,
          {
            type: "read-ambient-this",
            mode: context.mode,
            variable: node.name,
          },
        ),
      );
    }
  } else if (node.type === "MemberExpression") {
    return unbuildChainMemberCallee(node, meta, context);
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildChainElement(node, meta, context),
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
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude | import("../prelude").PrefixPrelude,
 *   import("../callee").Callee
 * >}
 */
export const unbuildCallee = (node, meta, context) => {
  const { _hash: hash } = node;
  if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier") {
    if (node.name === "eval") {
      return zeroSequence(EVAL_CALLEE);
    } else {
      return liftSequenceXX(
        makeRegularCallee,
        unbuildExpression(node, forkMeta((meta = nextMeta(meta))), context),
        makeScopeLoadExpression(
          hash,
          forkMeta((meta = nextMeta(meta))),
          context.scope,
          {
            type: "read-ambient-this",
            mode: context.mode,
            variable: node.name,
          },
        ),
      );
    }
  } else if (node.type === "MemberExpression") {
    return unbuildMemberCallee(node, meta, context);
  } else if (
    node.type === "ChainExpression" &&
    node.expression.type === "MemberExpression"
  ) {
    const callee = unbuildChainMemberCallee(node.expression, meta, context);
    return liftSequenceX_(
      makeRegularCallee,
      resolveChain(liftSequenceX(getFunction, callee), hash),
      callee.tail.this,
    );
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildExpression(node, meta, context),
      makeIntrinsicExpression("undefined", hash),
    );
  }
};
