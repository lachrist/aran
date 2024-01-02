import { makePrimitiveExpression } from "../node.mjs";
import { unbuildChainObject } from "./object.mjs";
import { optionalizeObject, unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  initSequence,
  makeEffectCondition,
  mapSequence,
  mapTwoSequence,
  passSequence,
  zeroSequence,
} from "../sequence.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { makeReadCacheExpression } from "../cache.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite } from "../site.mjs";
import { unbuildKey } from "./key.mjs";
import { makeGetMemberExpression } from "../member.mjs";

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
 *     object: import("./object").Object,
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
    throw new AranTypeError(object);
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
export const unbuildChainCallee = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({ type: "super" });
    }
    case "MemberExpression": {
      return mapTwoSequence(
        bindSequence(
          unbuildChainObject(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
            scope,
            null,
          ),
          (object) => {
            if (node.optional) {
              return initSequence(
                optionalizeObject({ path }, { object }),
                object,
              );
            } else {
              return zeroSequence(object);
            }
          },
        ),
        passSequence(
          unbuildKey(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "property",
            ),
            scope,
            { computed: node.computed },
          ),
          makeEffectCondition,
        ),
        (object, key) => ({
          type: "regular",
          function: makeGetMemberExpression(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { object, key },
          ),
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
