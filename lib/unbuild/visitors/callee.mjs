import { makePrimitiveExpression } from "../node.mjs";
import { unbuildChainObject } from "./object.mjs";
import { optionalizeObject, unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  bindTwoSequence,
  callSequence_X,
  liftSequenceXX,
  liftSequenceX_,
  zeroSequence,
} from "../sequence.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite } from "../site.mjs";
import { unbuildKey } from "./key.mjs";
import { makeGetMemberExpression } from "../member.mjs";
import { convertKey } from "../key.mjs";
import { duplicateObject } from "../object.mjs";
import { makeRegularCallee } from "../callee.mjs";
import { guard } from "../../util/index.mjs";

// We used to have a method to unbuild callee that return an EffectSequence.
// Returning a ConditionSequence is overkill for callsite in expression visitor.
// But callee can themselves be ChainElements. That requires to transform a
// ConditionSequence<Callee> to a EffectSequence<Callee>. I could not figure
// out how to do that so there is now but a single unbuild callee.

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     object: import("../object").Object,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
const makeThisExpression = ({ path, meta }, scope, { object }) => {
  if (object.type === "super") {
    return makeScopeLoadExpression({ path, meta }, scope, {
      type: "read-this",
      mode: getMode(scope),
    });
  } else if (object.type === "regular") {
    return zeroSequence(object.data);
  } else {
    throw new AranTypeError(object);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Super | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../callee").Callee
 * >}
 */
export const unbuildChainCallee = ({ node, path, meta }, scope, _options) => {
  if (node.type === "Super") {
    return zeroSequence({ type: "super" });
  } else if (node.type === "ChainExpression") {
    return unbuildChainCallee(
      drillSite(node, path, meta, "expression"),
      scope,
      null,
    );
  } else if (node.type === "MemberExpression") {
    return bindTwoSequence(
      bindSequence(
        guard(
          node.optional,
          (object) =>
            callSequence_X(
              optionalizeObject,
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              object,
            ),
          unbuildChainObject(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
            scope,
            null,
          ),
        ),
        (object) =>
          duplicateObject(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            object,
          ),
      ),
      unbuildKey(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "property"),
        scope,
        { computed: node.computed },
      ),
      ([object1, object2], key) =>
        liftSequenceXX(
          makeRegularCallee,
          makeGetMemberExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object: object1, key: convertKey({ path }, key) },
          ),
          makeThisExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object: object2 },
          ),
        ),
    );
  } else if (node.type === "Identifier" && node.name === "eval") {
    return zeroSequence({
      type: "eval",
    });
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildChainElement({ node, path, meta }, scope, _options),
      makePrimitiveExpression({ undefined: null }, path),
    );
  }
};
