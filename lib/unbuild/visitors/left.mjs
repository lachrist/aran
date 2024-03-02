import { drillSite, drillSiteArray, drillVeryDeepSite } from "../site.mjs";
import {
  EMPTY_STATEMENT,
  concatEffect,
  makeEffectStatement,
} from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import { bindSequence, prefixEffect, zeroSequence } from "../sequence.mjs";
import { cacheConstant } from "../cache.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { map } from "../../util/index.mjs";
import { VOID_COMPLETION } from "../completion.mjs";
import { reportEarlyError } from "../early-error.mjs";

/**
 * @type {(
 *   node: estree.VariableDeclarator,
 * ) => node is estree.VariableDeclarator & {
 *   init: estree.Expression
 * }}
 */
const hasInitDeclarator = (node) => node.init != null;

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
        completion: VOID_COMPLETION,
        loop: {
          break: null,
          continue: null,
        },
      });
    }
    default: {
      return makeEffectStatement(
        unbuildEffect({ node, path, meta }, scope, null),
        path,
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
      const { kind } = node;
      return makeEffectStatement(
        concatEffect(
          map(
            drillSiteArray(drillSite(node, path, meta, "declarations")),
            ({ node, path, meta }) => {
              if (hasInitDeclarator(node)) {
                return prefixEffect(
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      unbuildNameExpression(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "init",
                        ),
                        scope,
                        {
                          name:
                            node.id.type === "Identifier"
                              ? {
                                  type: "assignment",
                                  variable: /** @type {estree.Variable} */ (
                                    node.id.name
                                  ),
                                }
                              : { type: "anonymous" },
                        },
                      ),
                      path,
                    ),
                    (right) =>
                      unbuildPattern(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "id",
                        ),
                        scope,
                        {
                          kind,
                          right,
                        },
                      ),
                  ),
                );
              } else {
                return zeroSequence([]);
              }
            },
          ),
        ),
        path,
      );
    }
    default: {
      return EMPTY_STATEMENT;
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
        return reportEarlyError(
          [],
          "Invalid left-hand side in assignment",
          path,
        );
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
