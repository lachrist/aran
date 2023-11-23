import { drill, drillArray } from "../site.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeEffectStatement } from "../node.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  unbuildWritePatternEffect,
  unbuildInitializePatternEffect,
} from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.VariableDeclaration | estree.Expression
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {},
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildInit = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement({ node, path, meta }, context, {
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
        unbuildEffect({ node, path, meta }, context, { meta }),
        (effect) => makeEffectStatement(effect, path),
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.VariableDeclaration | estree.Pattern
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {},
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildLeftInit = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "VariableDeclaration": {
      switch (node.kind) {
        case "var": {
          return unbuildStatement({ node, path, meta }, context, {
            labels: [],
            completion: null,
            loop: {
              break: null,
              continue: null,
            },
          });
        }
        default: {
          const sites = drill({ node, path, meta }, ["declarations"]);
          return map(
            flatMap(drillArray(sites.declarations), (site) => {
              const sites = drill(site, ["init"]);
              return isNotNullishSite(sites.init)
                ? unbuildEffect(sites.init, context, {})
                : [];
            }),
            (node) => makeEffectStatement(node, path),
          );
        }
      }
    }
    default: {
      return [];
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<
 *     estree.VariableDeclaration | estree.Pattern,
 *   >,
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Effect<unbuild.Atom>)[]}
 */
export const unbuildLeftBody = ({ node, path, meta }, context, { right }) => {
  switch (node.type) {
    case "VariableDeclaration": {
      const sites = drill({ node, path, meta }, ["declarations"]);
      return unbuildInitializePatternEffect(
        drill(drillArray(sites.declarations)[0], ["id"]).id,
        context,
        { right },
      );
    }
    default: {
      return unbuildWritePatternEffect({ node, path, meta }, context, {
        right,
      });
    }
  }
};
