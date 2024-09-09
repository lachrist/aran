import { unbuildExpression } from "./expression.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { liftSequenceX, zeroSequence } from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { SUPER_OBJECT, makeRegularObject } from "../object.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Super
 *     | import("../../estree").Expression
 *   )>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../object").Object
 * >}
 */
export const unbuildObject = ({ node, path, meta }, { scope, deadzone }) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return liftSequenceX(
      makeRegularObject,
      unbuildExpression({ node, path, meta }, { scope, deadzone }),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Super
 *     | import("../../estree").Expression
 *   )>,
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
 *   import("../object").Object,
 * >}
 */
export const unbuildChainObject = (
  { node, path, meta },
  { scope, deadzone },
) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_OBJECT);
  } else {
    return liftSequenceX(
      makeRegularObject,
      unbuildChainElement(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
        { scope, deadzone },
      ),
    );
  }
};
