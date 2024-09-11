import { drillSite, drillSiteArray, drillVeryDeepSite } from "../site.mjs";
import { listEffectStatement } from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  callSequence_X,
  EMPTY_SEQUENCE,
  flatSequence,
  initSequence,
  liftSequence___X,
  liftSequenceX,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { EMPTY, flat, map } from "../../util/index.mjs";
import { makeErrorPrelude } from "../prelude/index.mjs";

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
 *   site: import("../site").Site<(
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Expression
 *   )>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     origin: "closure" | "program",
 *     hoisting: import("../annotate/hoisting-public").Hoisting,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildInit = (
  { node, path, meta },
  { scope, deadzone, origin, hoisting },
) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement(
        { node, path, meta },
        {
          scope,
          deadzone,
          origin,
          hoisting,
          labels: [],
          loop: {
            break: null,
            continue: null,
          },
        },
      );
    }
    default: {
      return liftSequenceX_(
        listEffectStatement,
        unbuildEffect({ node, path, meta }, { scope, deadzone }),
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
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildLeftHead = ({ node, path, meta }, { scope, deadzone }) => {
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
                  return callSequence_X(
                    unbuildPattern,
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "id",
                    ),
                    liftSequence___X(
                      makePatternContext,
                      scope,
                      deadzone,
                      kind,
                      unbuildNameExpression(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "init",
                        ),
                        {
                          scope,
                          deadzone,
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
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *     right: import("../atom").Expression,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildLeftBody = (
  { node, path, meta },
  { scope, deadzone, right },
) => {
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
        return unbuildPattern(
          drillVeryDeepSite(node, path, meta, "declarations", 0, "id"),
          { scope, deadzone, kind: node.kind, right },
        );
      } else {
        return initSequence(
          [
            makeErrorPrelude({
              message: "Invalid left-hand side in assignment",
              origin: path,
            }),
          ],
          EMPTY,
        );
      }
    }
    default: {
      return unbuildPattern(
        { node, path, meta },
        { scope, deadzone, kind: null, right },
      );
    }
  }
};
