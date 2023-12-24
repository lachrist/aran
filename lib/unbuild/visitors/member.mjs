import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { getPrivateKey } from "../query/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  initSequence,
  makeCondition,
  makeEffectCondition,
  mapSequence,
  mapTwoSequence,
  passSequence,
  zeroSequence,
} from "../sequence.mjs";
import { dispatchSite, drillSite, forkSite, nextSite } from "../site.mjs";
import { makeGetMemberExpression } from "../member.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").EffectSequence<(
 *   import("../member").MemberObject
 * )>}
 */
export const unbuildMemberObject = dispatchSite(
  { Super: (_site, _scope, _options) => zeroSequence({ type: "super" }) },
  (site, scope, _options) =>
    mapSequence(
      cacheConstant(
        forkSite((site = nextSite(site))),
        unbuildExpression(forkSite((site = nextSite(site))), scope, null),
      ),
      (object) => ({
        type: "regular",
        data: object,
      }),
    ),
);

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Super
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     optional: boolean,
 *   },
 * ) => import("../sequence").ConditionSequence<(
 *   import("../member").MemberObject
 * )>}
 */
export const unbuildChainMemberObject = dispatchSite(
  { Super: (_site, _scope, _options) => zeroSequence({ type: "super" }) },
  (site, scope, { optional }) => {
    const { path } = site;
    return bindSequence(
      unbuildChainElement(forkSite((site = nextSite(site))), scope, null),
      (object) =>
        bindSequence(
          passSequence(
            cacheConstant(forkSite((site = nextSite(site))), object),
            makeEffectCondition,
          ),
          (object) =>
            initSequence(
              optional
                ? [
                    makeCondition(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(object, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      makePrimitiveExpression({ undefined: null }, path),
                    ),
                  ]
                : [],
              {
                type: "regular",
                data: object,
              },
            ),
        ),
    );
  },
);

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.PrivateIdentifier
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     computed: boolean,
 *   },
 * ) => import("../sequence").EffectSequence<(
 *   import("../member").MemberKey
 * )>}
 */
export const unbuildMemberKey = dispatchSite(
  {
    PrivateIdentifier: (site, _scope, _options) =>
      zeroSequence({
        type: "private",
        data: getPrivateKey(site.node),
      }),
  },
  (site, scope, { computed }) =>
    mapSequence(
      cacheConstant(
        forkSite((site = nextSite(site))),
        unbuildKeyExpression(forkSite((site = nextSite(site))), scope, {
          convert: false,
          computed,
        }),
      ),
      (key) => ({
        type: "public",
        data: key,
      }),
    ),
);

/**
 * @type {(
 *   site: import("../site").Site<estree.MemberExpression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").ConditionSequence<{
 *   object: import("../member").MemberObject,
 *   key: import("../member").MemberKey,
 *   member: aran.Expression<unbuild.Atom>,
 * }>}
 */
export const unbuildChainMember = (site, scope, _options) =>
  mapTwoSequence(
    unbuildChainMemberObject(
      drillSite((site = nextSite(site)), "object"),
      scope,
      { optional: site.node.optional },
    ),
    passSequence(
      unbuildMemberKey(drillSite((site = nextSite(site)), "property"), scope, {
        computed: site.node.computed,
      }),
      makeEffectCondition,
    ),
    (object, key) => ({
      object,
      key,
      member: makeGetMemberExpression(
        forkSite((site = nextSite(site))),
        scope,
        { object, key },
      ),
    }),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.MemberExpression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").EffectSequence<{
 *   object: import("../member").MemberObject,
 *   key: import("../member").MemberKey,
 *   member: aran.Expression<unbuild.Atom>,
 * }>}
 */
export const unbuildMember = (site, scope, _options) =>
  mapTwoSequence(
    unbuildMemberObject(
      drillSite((site = nextSite(site)), "object"),
      scope,
      null,
    ),
    unbuildMemberKey(drillSite((site = nextSite(site)), "property"), scope, {
      computed: site.node.computed,
    }),
    (object, key) => ({
      object,
      key,
      member: makeGetMemberExpression(
        forkSite((site = nextSite(site))),
        scope,
        { object, key },
      ),
    }),
  );
