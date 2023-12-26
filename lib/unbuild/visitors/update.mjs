import { makeExpressionEffect, makePrimitiveExpression } from "../node.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import { unbuildObject } from "./object.mjs";
import { listSetMemberEffect, makeGetMemberExpression } from "../member.mjs";
import { initSequence, mapTwoSequence, zeroSequence } from "../sequence.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "../scope/index.mjs";
import { drillSite } from "../site.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildKey } from "./key.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").EffectSequence<
 *   import("./update").Update
 * >}
 */
export const unbuildUpdateLeft = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "CallExpression": {
      return initSequence(
        [
          ...unbuildEffect({ node, path, meta }, scope, null),
          makeExpressionEffect(
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              path,
            ),
            path,
          ),
        ],
        { type: "empty" },
      );
    }
    case "MemberExpression": {
      return mapTwoSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        unbuildKey(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "property"),
          scope,
          { computed: node.computed },
        ),
        (object, key) => ({
          type: "member",
          object,
          key,
        }),
      );
    }
    case "Identifier": {
      return zeroSequence({
        type: "variable",
        variable: /** @type {estree.Variable} */ (node.name),
      });
    }
    default: {
      return initSequence(
        [
          makeExpressionEffect(
            makeSyntaxErrorExpression(
              "Invalid optional member in left-hand side",
              path,
            ),
            path,
          ),
        ],
        { type: "empty" },
      );
    }
  }
};

/** @type {(update: import("./update").Update) => import("../name").Name} */
export const getUpdateName = (update) => {
  if (update.type === "empty") {
    return { type: "anonymous" };
  } else if (update.type === "member") {
    return { type: "anonymous" };
  } else if (update.type === "variable") {
    return {
      type: "assignment",
      variable: update.variable,
    };
  } else {
    throw new AranTypeError("invalid update");
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     update: import("./update").Update,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeLoadUpdateExpression = (site, scope, { update }) => {
  if (update.type === "empty") {
    return makePrimitiveExpression({ undefined: null }, site.path);
  } else if (update.type === "member") {
    return makeGetMemberExpression(site, scope, update);
  } else if (update.type === "variable") {
    return makeScopeLoadExpression(site, scope, {
      type: "read",
      mode: getMode(scope),
      variable: update.variable,
    });
  } else {
    throw new AranTypeError("invalid update");
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     update: import("./update").Update,
 *     new_value: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSaveUpdateEffect = (site, scope, { update, new_value }) => {
  if (update.type === "empty") {
    return [];
  } else if (update.type === "member") {
    return listSetMemberEffect(site, scope, {
      object: update.object,
      key: update.key,
      value: new_value,
    });
  } else if (update.type === "variable") {
    return listScopeSaveEffect(site, scope, {
      type: "write",
      mode: getMode(scope),
      variable: update.variable,
      right: new_value,
    });
  } else {
    throw new AranTypeError("invalid update");
  }
};
