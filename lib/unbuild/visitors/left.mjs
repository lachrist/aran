import { drillSite, drillSiteArray, drillVeryDeepSite } from "../site.mjs";
import { listEffectStatement } from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  callSequence__X,
  EMPTY_SEQUENCE,
  flatSequence,
  initSequence,
  liftSequence_X,
  liftSequenceX,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { EMPTY, flat, map } from "../../util/index.mjs";
import { makeSyntaxErrorPrelude } from "../prelude/index.mjs";

/**
 * @type {(
 *   node: import("../../estree").VariableDeclarator,
 * ) => node is import("../../estree").VariableDeclarator & {
 *   init: import("../../estree").Expression
 * }}
 */
const hasInitDeclarator = (node) => node.init != null;

/**
 * @type {(
 *   right: import("../atom").Expression,
 * ) => {
 *   right: import("../atom").Expression,
 * }}
 */
export const makeLeftContext = (right) => ({ right });

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Expression
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     origin: "closure" | "program",
 *     hoisting: import("../query/hoist-public").Hoisting,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildInit = (
  { node, path, meta },
  scope,
  { origin, hoisting },
) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement({ node, path, meta }, scope, {
        origin,
        hoisting,
        labels: [],
        loop: {
          break: null,
          continue: null,
        },
      });
    }
    default: {
      return liftSequenceX_(
        listEffectStatement,
        unbuildEffect({ node, path, meta }, scope, null),
        path,
      );
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Pattern
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildLeftHead = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "VariableDeclaration": {
      const { kind } = node;
      return liftSequenceX_(
        listEffectStatement,
        liftSequenceX(
          flat,
          flatSequence(
            map(
              drillSiteArray(drillSite(node, path, meta, "declarations")),
              ({ node, path, meta }) => {
                if (hasInitDeclarator(node)) {
                  return callSequence__X(
                    unbuildPattern,
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "id",
                    ),
                    scope,
                    liftSequence_X(
                      makePatternContext,
                      kind,
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
                                  variable:
                                    /** @type {import("../../estree").Variable} */ (
                                      node.id.name
                                    ),
                                }
                              : { type: "anonymous" },
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
        ),
        path,
      );
    }
    default: {
      return EMPTY_SEQUENCE;
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Pattern
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     right: import("../atom").Expression,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
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
        return initSequence(
          [
            makeSyntaxErrorPrelude({
              message: "Invalid left-hand side in assignment",
              origin: path,
            }),
          ],
          EMPTY,
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
