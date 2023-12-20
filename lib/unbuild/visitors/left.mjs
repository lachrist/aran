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

/**
 * @type {(
 *   site: import("../site.d.ts").Site<
 *     estree.VariableDeclaration | estree.Expression
 *   >,
 *   scope: import("../scope").Scope,
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
 *   site: import("../site.d.ts").Site<
 *     estree.VariableDeclaration | estree.Pattern
 *   >,
 *   scope: import("../scope").Scope,
 *   options: {},
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildLeftInit = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "VariableDeclaration": {
      const sites = drill({ node, path, meta }, ["declarations"]);
      return map(
        flatMap(drillArray(sites.declarations), (site) => {
          const sites = drill(site, ["id", "init"]);
          if (isNotNullishSite(sites.init)) {
            return unbuildInitializePatternEffect(sites.id, context, {
              right: isNameSite(sites.init)
                ? unbuildNameExpression(sites.init, context, {
                    name: makePrimitiveExpression(
                      site.node.id.type === "Identifier"
                        ? site.node.id.name
                        : "",
                      path,
                    ),
                  })
                : unbuildExpression(sites.init, context, {}),
            });
          } else {
            return [];
          }
        }),
        (node) => makeEffectStatement(node, path),
      );
    }
    //   switch (node.kind) {
    //     case "var": {
    //       return unbuildStatement({ node, path, meta }, context, {
    //         labels: [],
    //         completion: null,
    //         loop: {
    //           break: null,
    //           continue: null,
    //         },
    //       });
    //     }
    //     default: {
    //       const sites = drill({ node, path, meta }, ["declarations"]);
    //       return map(
    //         flatMap(drillArray(sites.declarations), (site) => {
    //           const sites = drill(site, ["init"]);
    //           return isNotNullishSite(sites.init)
    //             ? unbuildEffect(sites.init, context, {})
    //             : [];
    //         }),
    //         (node) => makeEffectStatement(node, path),
    //       );
    //     }
    //   }
    // }
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
