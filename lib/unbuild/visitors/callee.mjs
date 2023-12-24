import { makePrimitiveExpression } from "../node.mjs";
import { unbuildChainMember } from "./member.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { mapSequence, zeroSequence } from "../sequence.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { makeReadCacheExpression } from "../cache.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

// We used to have a method to unbuild callee that return an EffectSequence.
// Returning a ConditionSequence is overkill for callsite in expression visitor.
// But callee can themselves be ChainElements. That requires to transform a
// ConditionSequence<Callee> to a EffectSequence<Callee>. I could not figure
// out how to do that so there is now but a single unbuild callee.

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../meta").Meta,
 *   },
 *   scope: import("../scope").Scope,
 *   options: {
 *     object: import("../member").MemberObject,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeThisExpression = ({ path, meta }, scope, { object }) => {
  if (object.type === "super") {
    return makeScopeLoadExpression({ path, meta }, scope, {
      type: "read-this",
      mode: getMode(scope),
    });
  } else if (object.type === "regular") {
    return makeReadCacheExpression(object.data, path);
  } else {
    throw new AranTypeError("invalid object", object);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Super | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence.d.ts").ConditionSequence<
 *   import("./callee.d.ts").Callee
 * >}
 */
export const unbuildCallee = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({ type: "super" });
    }
    case "MemberExpression": {
      return mapSequence(
        unbuildChainMember(
          { node, path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          null,
        ),
        ({ object, member }) => ({
          type: "regular",
          function: member,
          this: makeThisExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object },
          ),
        }),
      );
    }
    default: {
      return mapSequence(
        unbuildChainElement({ node, path, meta }, scope, _options),
        (result) => ({
          type: "regular",
          function: result,
          this: makePrimitiveExpression({ undefined: null }, path),
        }),
      );
    }
  }
};
