import { transExpression } from "./expression.mjs";
import { transChainElement } from "./chain.mjs";
import { liftSequenceX, zeroSequence } from "../../util/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { SUPER_OBJECT, makeRegularObject } from "../object.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../object").Object
 * >}
 */
export const transObject = (node, meta, scope) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return liftSequenceX(makeRegularObject, transExpression(node, meta, scope));
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../hash").HashProp>
 *     | import("estree-sentry").ChainableExpression<import("../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../object").Object,
 * >}
 */
export const transChainObject = (node, meta, scope) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return liftSequenceX(
      makeRegularObject,
      transChainElement(node, forkMeta((meta = nextMeta(meta))), scope),
    );
  }
};
