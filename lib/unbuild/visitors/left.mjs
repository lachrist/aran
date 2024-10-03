import { listEffectStatement } from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import {
  callSequence____X,
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
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";

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
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildInit = (node, meta, context) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement(node, meta, context, INITIAL_STATEMENT_LABELING);
    }
    default: {
      return liftSequenceX_(
        listEffectStatement,
        unbuildEffect(node, meta, context),
        hash,
      );
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").Pattern<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildLeftHead = (node, meta, context) => {
  const { _hash: hash } = node;
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
                return callSequence____X(
                  unbuildPattern,
                  node.id,
                  forkMeta((meta = nextMeta(meta))),
                  context,
                  kind,
                  unbuildNameExpression(
                    node.init,
                    forkMeta((meta = nextMeta(meta))),
                    context,
                    node.id.type === "Identifier"
                      ? {
                          type: "assignment",
                          variable: node.id.name,
                        }
                      : { type: "anonymous" },
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
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").Pattern<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 *   right: import("../atom").Expression,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildLeftBody = (node, meta, context, right) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
        return unbuildPattern(
          node.declarations[0].id,
          meta,
          context,
          node.kind,
          right,
        );
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
      return unbuildPattern(node, meta, context, null, right);
    }
  }
};
