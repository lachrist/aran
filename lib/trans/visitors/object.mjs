import { transExpression } from "./expression.mjs";
import { transChainElement } from "./chain.mjs";
import { liftSequenceX, zeroSequence } from "../../util/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { SUPER_OBJECT, makeRegularObject } from "../object.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Super<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").Expression<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../object.d.ts").Object
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
 *   import("../object.d.ts").Object,
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
