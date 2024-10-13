import { listEffectStatement, makeExpressionEffect } from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";
import { liftSequenceX_ } from "../../sequence.mjs";
import { tuple2 } from "../../util/index.mjs";
import { initSyntaxErrorExpression } from "../prelude/index.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import { AranExecError, AranTypeError } from "../../report.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
 * >}
 */
export const unbuildInit = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.kind === "var") {
        return unbuildStatement(node, meta, scope, INITIAL_STATEMENT_LABELING);
      } else {
        throw new AranExecError(
          "lexical declaration should have been redirected",
          { node, meta, scope },
        );
      }
    }
    default: {
      return liftSequenceX_(
        listEffectStatement,
        unbuildEffect(node, meta, scope),
        hash,
      );
    }
  }
};

/**
 * @type {(
 *   kind: "var" | "let" | "const",
 * ) => "write" | "initialize"}
 */
const getAssignKind = (kind) => {
  switch (kind) {
    case "var": {
      return "write";
    }
    case "let": {
      return "initialize";
    }
    case "const": {
      return "initialize";
    }
    default: {
      throw new AranTypeError(kind);
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
 *   scope: import("../scope").Scope,
 *   right: import("../atom").Expression,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildLeft = (node, meta, scope, right) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
        if (node.declarations[0].init == null) {
          return unbuildPattern(
            node.declarations[0].id,
            meta,
            scope,
            getAssignKind(node.kind),
            right,
          );
        } else {
          return liftSequenceX_(
            tuple2,
            liftSequenceX_(
              makeExpressionEffect,
              initSyntaxErrorExpression(
                "Left-hand declaration can't have initializer",
                hash,
              ),
              hash,
            ),
            scope,
          );
        }
      } else {
        return liftSequenceX_(
          tuple2,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression(
              "Left-hand declaration can only have one declarator",
              hash,
            ),
            hash,
          ),
          scope,
        );
      }
    }
    default: {
      return unbuildPattern(node, meta, scope, "write", right);
    }
  }
};
