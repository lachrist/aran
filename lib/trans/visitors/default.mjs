import { makeEffectStatement, makeExportEffect } from "../node.mjs";
import { DEFAULT_SPECIFIER } from "../query/index.mjs";
import { liftSequenceX_, liftSequence_X_, tuple2 } from "../../util/index.mjs";
import { transNameExpression } from "./expression.mjs";
import { transBodyStatement } from "./statement.mjs";
import { transClass } from "./class.mjs";
import { transFunction } from "./function.mjs";
import { DEFAULT_NAME } from "../name.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import { PLAIN_CLOSURE } from "../closure.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").ExportDefaultDeclaration<import("../hash.d.ts").HashProp>["declaration"],
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   [
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
 *     scope: import("../scope/index.d.ts").Scope,
 *   ],
 * >}
 */
export const transDefault = (node, meta, scope) => {
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
            transClass(node, meta, scope, DEFAULT_NAME),
            hash,
          ),
          hash,
        ),
        scope,
      );
    } else {
      return transBodyStatement(node, meta, scope, INITIAL_STATEMENT_LABELING);
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
            transFunction(node, meta, scope, PLAIN_CLOSURE, DEFAULT_NAME),
            hash,
          ),
          hash,
        ),
        scope,
      );
    } else {
      return transBodyStatement(node, meta, scope, INITIAL_STATEMENT_LABELING);
    }
  } else {
    return liftSequenceX_(
      tuple2,
      liftSequenceX_(
        makeEffectStatement,
        liftSequence_X_(
          makeExportEffect,
          DEFAULT_SPECIFIER,
          transNameExpression(node, meta, scope, DEFAULT_NAME),
          hash,
        ),
        hash,
      ),
      scope,
    );
  }
};
