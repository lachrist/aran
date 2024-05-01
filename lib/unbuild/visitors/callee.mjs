import { makeIntrinsicExpression } from "../node.mjs";
import { unbuildChainObject, unbuildObject } from "./object.mjs";
import { unbuildChainElement } from "./chain.mjs";
import {
  bindSequence,
  bindTwoSequence,
  callSequence_X,
  liftSequenceX,
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
import { duplicateObject, optionalizeObject } from "../object.mjs";
import { EVAL_CALLEE, SUPER_CALLEE, makeRegularCallee } from "../callee.mjs";
import { compileGet, guard } from "../../util/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { resolveChain } from "../chain.mjs";

// We used to have a method to unbuild callee that return an EffectSequence.
// Returning a ConditionSequence is overkill for callsite in expression visitor.
// But callee can themselves be ChainElements. That requires to transform a
// ConditionSequence<Callee> to a EffectSequence<Callee>. I could not figure
// out how to do that so there is now but a single unbuild callee.

const getFunction = compileGet("function");

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
 *   site: import("../site").Site<estree.MemberExpression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../callee").RegularCallee,
 * >}
 */
const unbuildMemberCallee = ({ node, path, meta }, scope, _options) =>
  bindTwoSequence(
    bindSequence(
      unbuildObject(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
        scope,
        null,
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

/**
 * @type {(
 *   site: import("../site").Site<estree.MemberExpression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").BodyPrelude
 *     | import("../prelude").PrefixPrelude
 *     | import("../prelude").ConditionPrelude
 *   ),
 *   import("../callee").RegularCallee,
 * >}
 */
const unbuildChainMemberCallee = ({ node, path, meta }, scope, _options) =>
  bindTwoSequence(
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
 *   import("../callee").Callee,
 * >}
 */
export const unbuildChainCallee = ({ node, path, meta }, scope, _options) => {
  if (node.type === "ChainExpression") {
    return unbuildChainCallee(
      drillSite(node, path, meta, "expression"),
      scope,
      null,
    );
  } else if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier" && node.name === "eval") {
    return zeroSequence(EVAL_CALLEE);
  } else if (node.type === "MemberExpression") {
    return unbuildChainMemberCallee({ node, path, meta }, scope, null);
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildChainElement({ node, path, meta }, scope, _options),
      makeIntrinsicExpression("undefined", path),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Super | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude | import("../prelude").PrefixPrelude,
 *   import("../callee").Callee
 * >}
 */
export const unbuildCallee = ({ node, path, meta }, scope, _options) => {
  if (node.type === "Super") {
    return zeroSequence(SUPER_CALLEE);
  } else if (node.type === "Identifier" && node.name === "eval") {
    return zeroSequence(EVAL_CALLEE);
  } else if (node.type === "MemberExpression") {
    return unbuildMemberCallee({ node, path, meta }, scope, null);
  } else if (
    node.type === "ChainExpression" &&
    node.expression.type === "MemberExpression"
  ) {
    const callee = unbuildChainMemberCallee(
      { node: node.expression, path, meta },
      scope,
      null,
    );
    return liftSequenceX_(
      makeRegularCallee,
      resolveChain(liftSequenceX(getFunction, callee), path),
      callee.tail.this,
    );
  } else {
    return liftSequenceX_(
      makeRegularCallee,
      unbuildExpression({ node, path, meta }, scope, _options),
      makeIntrinsicExpression("undefined", path),
    );
  }
};
