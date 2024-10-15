import {
  listEffectStatement,
  makeEffectStatement,
  makeExpressionEffect,
} from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { unbuildBodyStatement, unbuildStatement } from "./statement.mjs";
import { tuple2, liftSequenceX_, NULL_SEQUENCE } from "../../util/index.mjs";
import { initSyntaxErrorExpression } from "../prelude/index.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import { AranTypeError } from "../../error.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
 * >}
 */
export const unbuildRegularInit = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement(node, meta, scope, INITIAL_STATEMENT_LABELING);
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
 *   node: (
 *     | import("estree-sentry").VariableDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Statement>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildLexicalInit = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildBodyStatement(
        node,
        meta,
        scope,
        INITIAL_STATEMENT_LABELING,
      );
    }
    default: {
      return liftSequenceX_(
        tuple2,
        liftSequenceX_(
          listEffectStatement,
          unbuildEffect(node, meta, scope),
          hash,
        ),
        scope,
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
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Statement>,
 * >}
 */
export const unbuildLeftHead = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
        if (node.declarations[0].init == null) {
          return NULL_SEQUENCE;
        } else {
          return unbuildStatement(
            node,
            meta,
            scope,
            INITIAL_STATEMENT_LABELING,
          );
        }
      } else {
        return liftSequenceX_(
          makeEffectStatement,
          liftSequenceX_(
            makeExpressionEffect,
            initSyntaxErrorExpression(
              "Left-hand declaration can only have one declarator",
              hash,
            ),
            hash,
          ),
          hash,
        );
      }
    }
    default: {
      return NULL_SEQUENCE;
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
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildLeftBody = (node, meta, scope, right) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "VariableDeclaration": {
      if (node.declarations.length === 1) {
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
