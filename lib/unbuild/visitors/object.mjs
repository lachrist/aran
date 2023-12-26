import { cacheConstant } from "../cache.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  makeEffectCondition,
  mapSequence,
  passSequence,
  zeroSequence,
} from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").EffectSequence<(
 *   import("./object").Object
 * )>}
 */
export const unbuildObject = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({
        type: "super",
      });
    }
    default: {
      return mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          unbuildExpression(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            null,
          ),
          path,
        ),
        (object) => ({
          type: "regular",
          data: object,
        }),
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").ConditionSequence<(
 *   import("./object").Object
 * )>}
 */
export const unbuildChainObject = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({
        type: "super",
      });
    }
    default: {
      return bindSequence(
        unbuildChainElement(
          { node, path, meta: forkMeta((meta = nextMeta(meta))) },
          scope,
          null,
        ),
        (object) =>
          mapSequence(
            passSequence(
              cacheConstant(forkMeta((meta = nextMeta(meta))), object, path),
              makeEffectCondition,
            ),
            (object) => ({ type: "regular", data: object }),
          ),
      );
    }
  }
};

// /**
//  * @type {(
//  *   site: import("../site").Site<estree.MemberExpression>,
//  *   scope: import("../scope").Scope,
//  *   options: null,
//  * ) => import("../sequence").ConditionSequence<{
//  *   object: import("../member").MemberObject,
//  *   key: import("../member").MemberKey,
//  *   member: aran.Expression<unbuild.Atom>,
//  * }>}
//  */
// export const unbuildChainMember = (site, scope, _options) =>
//   mapTwoSequence(
//     unbuildChainMemberObject(
//       drillSite((site = nextSite(site)), "object"),
//       scope,
//       { optional: site.node.optional },
//     ),
//     passSequence(
//       unbuildMemberKey(drillSite((site = nextSite(site)), "property"), scope, {
//         computed: site.node.computed,
//       }),
//       makeEffectCondition,
//     ),
//     (object, key) => ({
//       object,
//       key,
//       member: makeGetMemberExpression(
//         forkSite((site = nextSite(site))),
//         scope,
//         { object, key },
//       ),
//     }),
//   );

// /**
//  * @type {(
//  *   site: import("../site").Site<estree.MemberExpression>,
//  *   scope: import("../scope").Scope,
//  *   options: null,
//  * ) => import("../sequence").EffectSequence<{
//  *   object: import("../member").MemberObject,
//  *   key: import("../member").MemberKey,
//  *   member: aran.Expression<unbuild.Atom>,
//  * }>}
//  */
// export const unbuildMember = (site, scope, _options) =>
//   mapTwoSequence(
//     unbuildMemberObject(
//       drillSite((site = nextSite(site)), "object"),
//       scope,
//       null,
//     ),
//     unbuildMemberKey(drillSite((site = nextSite(site)), "property"), scope, {
//       computed: site.node.computed,
//     }),
//     (object, key) => ({
//       object,
//       key,
//       member: makeGetMemberExpression(
//         forkSite((site = nextSite(site))),
//         scope,
//         { object, key },
//       ),
//     }),
//   );
