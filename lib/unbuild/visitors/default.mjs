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

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Expression | import("../../estree").Declaration>,
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
  if (
    node.type === "VariableDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    return unbuildStatement({ node, path, meta }, scope, {
      hoisting,
      labels: [],
      origin,
      loop: { break: null, continue: null },
    });
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
