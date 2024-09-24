import { listEffectStatement } from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  callSequence__X,
  EMPTY_SEQUENCE,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { EMPTY, flat, map } from "../../util/index.mjs";
import { makeSyntaxErrorPrelude } from "../prelude/index.mjs";
import { digest } from "../annotation/index.mjs";

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
 *   node: (
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Expression
 *   ),
 *   meta: import("../meta").Meta,
 *   options: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
 *     origin: "closure" | "program",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildInit = (node, meta, { scope, annotation, origin }) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement(node, meta, {
        scope,
        annotation,
        origin,
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
        unbuildEffect(node, meta, { scope, annotation }),
        hash,
      );
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Pattern
 *   ),
 *   meta: import("../meta").Meta,
 *   context: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildLeftHead = (node, meta, { scope, annotation }) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "VariableDeclaration": {
      const { kind } = node;
      return liftSequenceX_(
        listEffectStatement,
        liftSequenceX(
          flat,
          flatSequence(
            map(node.declarations, (node) => {
              if (node.init != null) {
                return callSequence__X(
                  unbuildPattern,
                  node.id,
                  forkMeta((meta = nextMeta(meta))),
                  liftSequenceX_(
                    makePatternContext,
                    unbuildNameExpression(
                      node.init,
                      forkMeta((meta = nextMeta(meta))),
                      {
                        scope,
                        annotation,
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
                    { kind, scope, annotation },
                  ),
                );
              } else {
                return zeroSequence([]);
              }
            }),
          ),
        ),
        hash,
      );
    }
    default: {
      return EMPTY_SEQUENCE;
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").VariableDeclaration
 *     | import("../../estree").Pattern
 *   ),
 *   meta: import("../meta").Meta,
 *   context: {
 *     scope: import("../scope").Scope,
 *     annotation: import("../annotation").Annotation,
 *     right: import("../atom").Expression,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildLeftBody = (node, meta, { scope, annotation, right }) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
        return unbuildPattern(node.declarations[0].id, meta, {
          scope,
          annotation,
          kind: node.kind,
          right,
        });
      } else {
        return initSequence(
          [
            makeSyntaxErrorPrelude({
              message: "Invalid left-hand side in assignment",
              origin: hash,
            }),
          ],
          EMPTY,
        );
      }
    }
    default: {
      return unbuildPattern(node, meta, {
        scope,
        annotation,
        kind: null,
        right,
      });
    }
  }
};
