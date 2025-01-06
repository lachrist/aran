import { makeEffectStatement, makeExportEffect } from "../node.mjs";
import { DEFAULT_SPECIFIER } from "../query/index.mjs";
import { liftSequenceX_, liftSequence_X_, tuple2 } from "../../util/index.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildBodyStatement } from "./statement.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildFunction } from "./function.mjs";
import { DEFAULT_NAME } from "../name.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import { PLAIN_CLOSURE } from "../closure.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").ExportDefaultDeclaration<import("../../hash").HashProp>["declaration"],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Statement>,
 *     scope: import("../scope").Scope,
 *   ],
 * >}
 */
export const unbuildDefault = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "ClassDeclaration") {
    if (node.id == null) {
      return liftSequenceX_(
        tuple2,
        liftSequenceX_(
          makeEffectStatement,
          liftSequence_X_(
            makeExportEffect,
            DEFAULT_SPECIFIER,
            unbuildClass(node, meta, scope, DEFAULT_NAME),
            hash,
          ),
          hash,
        ),
        scope,
      );
    } else {
      return unbuildBodyStatement(
        node,
        meta,
        scope,
        INITIAL_STATEMENT_LABELING,
      );
    }
  } else if (node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return liftSequenceX_(
        tuple2,
        liftSequenceX_(
          makeEffectStatement,
          liftSequence_X_(
            makeExportEffect,
            DEFAULT_SPECIFIER,
            unbuildFunction(node, meta, scope, PLAIN_CLOSURE, DEFAULT_NAME),
            hash,
          ),
          hash,
        ),
        scope,
      );
    } else {
      return unbuildBodyStatement(
        node,
        meta,
        scope,
        INITIAL_STATEMENT_LABELING,
      );
    }
  } else {
    return liftSequenceX_(
      tuple2,
      liftSequenceX_(
        makeEffectStatement,
        liftSequence_X_(
          makeExportEffect,
          DEFAULT_SPECIFIER,
          unbuildNameExpression(node, meta, scope, DEFAULT_NAME),
          hash,
        ),
        hash,
      ),
      scope,
    );
  }
};
