import { drill, drillArray } from "../site.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeEffectStatement, makePrimitiveExpression } from "../node.mjs";
import { isNameSite, isNotNullishSite } from "../predicate.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  unbuildWritePatternEffect,
  unbuildInitializePatternEffect,
} from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { mapSequence } from "../sequence.mjs";
import { cacheConstant } from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.VariableDeclaration | estree.Expression
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildInit = ({ node, path, meta }, scope, {}) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement({ node, path, meta }, scope, {
        labels: [],
        completion: null,
        loop: {
          break: null,
          continue: null,
        },
      });
    }
    default: {
      return map(
        unbuildEffect({ node, path, meta }, scope, { meta }),
        (effect) => makeEffectStatement(effect, path),
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.VariableDeclaration | estree.Pattern
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildLeftInit = ({ node, path, meta }, scope, {}) => {
  switch (node.type) {
    case "VariableDeclaration": {
      const metas = splitMeta(meta, ["drill", "right"]);
      const sites = drill({ node, path, meta : metas.drill}, ["declarations"]);
      return map(
        flatMap(drillArray(sites.declarations), (site) => {
          if (isNotNullishSite(site)) {
            return sequenceEffect(
              mapSequence(
                cacheConstant(
                  metas.init,

            return unbuildInitializePatternEffect(sites.id, scope, {
              right: isNameSite(sites.init)
                ? unbuildNameExpression(sites.init, scope, {
                    name: makePrimitiveExpression(
                      site.node.id.type === "Identifier"
                        ? site.node.id.name
                        : "",
                      path,
                    ),
                  })
                : unbuildExpression(sites.init, scope, {}),
            });
          } else {
            return [];
          }
        }),
        (node) => makeEffectStatement(node, path),
      );
    }
    default: {
      return [];
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.VariableDeclaration | estree.Pattern,
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildLeftBody = ({ node, path, meta }, scope, { right }) => {
  switch (node.type) {
    case "VariableDeclaration": {
      const sites = drill({ node, path, meta }, ["declarations"]);
      return unbuildInitializePatternEffect(
        drill(drillArray(sites.declarations)[0], ["id"]).id,
        scope,
        { right },
      );
    }
    default: {
      return unbuildWritePatternEffect({ node, path, meta }, scope, {
        right,
      });
    }
  }
};
