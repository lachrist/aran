import { concat_ } from "../../util/index.mjs";
import { makeEffectStatement, makeExportEffect } from "../node.mjs";
import { DEFAULT_SPECIFIER } from "../query/index.mjs";
import {
  liftSequenceX,
  liftSequenceX_,
  liftSequence_X_,
} from "../../sequence.mjs";
import { unbuildNameExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";
import { unbuildClass } from "./class.mjs";
import { unbuildFunction } from "./function.mjs";
import { DEFAULT_NAME } from "../name.mjs";
import { INITIAL_STATEMENT_LABELING } from "../labeling.mjs";
import { FUNCTION_PARAM } from "../param.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").ExportDefaultDeclaration<import("../../hash").HashProp>["declaration"],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildDefault = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "ClassDeclaration") {
    if (node.id == null) {
      return liftSequenceX(
        concat_,
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
      );
    } else {
      return unbuildStatement(node, meta, scope, INITIAL_STATEMENT_LABELING);
    }
  } else if (node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeEffectStatement,
          liftSequence_X_(
            makeExportEffect,
            DEFAULT_SPECIFIER,
            unbuildFunction(node, meta, scope, FUNCTION_PARAM, DEFAULT_NAME),
            hash,
          ),
          hash,
        ),
      );
    } else {
      return unbuildStatement(node, meta, scope, INITIAL_STATEMENT_LABELING);
    }
  } else {
    return liftSequenceX(
      concat_,
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
    );
  }
};
