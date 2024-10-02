import { unbuildExpression } from "./expression.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { liftSequenceX, zeroSequence } from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { SUPER_OBJECT, makeRegularObject } from "../object.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../object").Object
 * >}
 */
export const unbuildObject = (node, meta, { scope, annotation }) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return liftSequenceX(
      makeRegularObject,
      unbuildExpression(node, meta, { scope, annotation }),
    );
  }
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
 *   import("../object").Object,
 * >}
 */
export const unbuildChainObject = (node, meta, { scope, annotation }) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return liftSequenceX(
      makeRegularObject,
      unbuildChainElement(node, forkMeta((meta = nextMeta(meta))), {
        scope,
        annotation,
      }),
    );
  }
};
