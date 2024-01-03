import { drillVeryDeepSite } from "../site.mjs";
import { map } from "../../util/index.mjs";
import { makeEffectStatement, makeExpressionEffect } from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.VariableDeclaration
 *     | estree.Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildInit = ({ node, path, meta }, scope, _options) => {
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
      return map(unbuildEffect({ node, path, meta }, scope, null), (effect) =>
        makeEffectStatement(effect, path),
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.VariableDeclaration
 *     | estree.Pattern
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildLeftHead = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "VariableDeclaration": {
      //   const sites = drill({ node, path, meta }, ["declarations"]);
      //   return map(
      //     flatMap(drillArray(sites.declarations), (site) => {
      //       const sites = drill(site, ["id", "init"]);
      //       if (isNotNullishSite(sites.init)) {
      //         return unbuildInitializePatternEffect(sites.id, context, {
      //           right: isNameSite(sites.init)
      //             ? unbuildNameExpression(sites.init, context, {
      //                 name: makePrimitiveExpression(
      //                   site.node.id.type === "Identifier"
      //                     ? site.node.id.name
      //                     : "",
      //                   path,
      //                 ),
      //               })
      //             : unbuildExpression(sites.init, context, {}),
      //         });
      //       } else {
      //         return [];
      //       }
      //     }),
      //     (node) => makeEffectStatement(node, path),
      //   );
      // }
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
      return [];
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.VariableDeclaration
 *     | estree.Pattern
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: import("../cache").Cache,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
export const unbuildLeftBody = ({ node, path, meta }, scope, { right }) => {
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
        return unbuildPattern(
          drillVeryDeepSite(node, path, meta, "declarations", 0, "id"),
          scope,
          { kind: node.kind, right },
        );
      } else {
        return [
          makeExpressionEffect(
            makeEarlyErrorExpression(
              "Invalid left-hand side in assignment",
              path,
            ),
            path,
          ),
        ];
      }
    }
    default: {
      return unbuildPattern({ node, path, meta }, scope, {
        kind: null,
        right,
      });
    }
  }
};
