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

/**
 * @type {(
 *   node: import("estree-sentry").ExportDefaultDeclaration<import("../../hash").HashProp>["declaration"],
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context & {
 *     origin: "closure" | "program",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildDefault = (node, meta, { scope, annotation, origin }) => {
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
            unbuildClass(node, meta, {
              scope,
              annotation,
              name: { type: "default" },
            }),
            hash,
          ),
          hash,
        ),
      );
    } else {
      return unbuildStatement(node, meta, {
        scope,
        annotation,
        labels: [],
        origin,
        loop: { break: null, continue: null },
      });
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
            unbuildFunction(node, meta, {
              scope,
              annotation,
              type: "function",
              name: { type: "default" },
            }),
            hash,
          ),
          hash,
        ),
      );
    } else {
      return unbuildStatement(node, meta, {
        scope,
        annotation,
        labels: [],
        origin,
        loop: { break: null, continue: null },
      });
    }
  } else {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeEffectStatement,
        liftSequence_X_(
          makeExportEffect,
          DEFAULT_SPECIFIER,
          unbuildNameExpression(node, meta, {
            scope,
            annotation,
            name: { type: "default" },
          }),
          hash,
        ),
        hash,
      ),
    );
  }
};
