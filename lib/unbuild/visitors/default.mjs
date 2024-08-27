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
 *   site: import("../site").Site<(
 *     import("../../estree").ExportDefaultDeclaration["declaration"]
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
export const unbuildDefault = (
  { node, path, meta },
  scope,
  { origin, hoisting },
) => {
  if (node.type === "ClassDeclaration") {
    if (node.id == null) {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeEffectStatement,
          liftSequence_X_(
            makeExportEffect,
            DEFAULT_SPECIFIER,
            unbuildClass({ node, path, meta }, scope, {
              name: { type: "default" },
            }),
            path,
          ),
          path,
        ),
      );
    } else {
      return unbuildStatement({ node, path, meta }, scope, {
        hoisting,
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
            unbuildFunction({ node, path, meta }, scope, {
              type: "function",
              name: { type: "default" },
            }),
            path,
          ),
          path,
        ),
      );
    } else {
      return unbuildStatement({ node, path, meta }, scope, {
        hoisting,
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
          unbuildNameExpression({ node, path, meta }, scope, {
            name: { type: "default" },
          }),
          path,
        ),
        path,
      ),
    );
  }
};
