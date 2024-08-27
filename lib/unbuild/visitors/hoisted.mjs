import { drillDeepSite, drillSite } from "../site.mjs";
import { flat, mapIndex } from "../../util/index.mjs";
import { listEffectStatement } from "../node.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  flatSequence,
  liftSequenceX,
  liftSequenceX_,
} from "../../sequence.mjs";

/**
 * @type {(
 *   node: import("../../estree").ExportDefaultDeclaration,
 * ) => node is import("../../estree").ExportDefaultDeclaration & {
 *   declaration: (
 *     | import("../../estree").FunctionDeclaration
 *     | import("../../estree").ClassDeclaration
 *   ),
 * }}
 */
const hasDefaultDeclaration = (node) =>
  node.declaration != null &&
  (node.declaration.type === "FunctionDeclaration" ||
    node.declaration.type === "ClassDeclaration") &&
  node.declaration.id != null;

/**
 * @type {(
 *   node: import("../../estree").ExportNamedDeclaration,
 * ) => node is import("../../estree").ExportNamedDeclaration & {
 *   declaration: (
 *     | import("../../estree").FunctionDeclaration
 *     | import("../../estree").ClassDeclaration
 *     | import("../../estree").VariableDeclaration
 *   ),
 * }}
 */
const hasExportDeclaration = (node) => node.declaration != null;

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *     | import("../../estree").SwitchCase
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildHoistedStatement = (
  { node, path, meta },
  scope,
  { hoisting },
) => {
  switch (node.type) {
    case "SwitchCase": {
      return liftSequenceX(
        flat,
        flatSequence(
          mapIndex(node.consequent.length, (index) =>
            unbuildHoistedStatement(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "consequent",
                index,
              ),
              scope,
              { hoisting },
            ),
          ),
        ),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(
        drillSite(node, path, meta, "body"),
        scope,
        { hoisting },
      );
    }
    case "ExportNamedDeclaration": {
      return hasExportDeclaration(node)
        ? unbuildHoistedStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            { hoisting },
          )
        : EMPTY_SEQUENCE;
    }
    case "ExportDefaultDeclaration": {
      return hasDefaultDeclaration(node)
        ? unbuildHoistedStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            { hoisting },
          )
        : EMPTY_SEQUENCE;
    }
    case "FunctionDeclaration": {
      const mode = getMode(scope);
      return liftSequenceX_(
        listEffectStatement,
        bindSequence(
          unbuildFunction(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "function",
              name: {
                type: "assignment",
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
              },
            },
          ),
          (right) =>
            listScopeSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "initialize",
                variable: /** @type {import("../../estree").Variable} */ (
                  node.id.name
                ),
                mode,
                right,
              },
            ),
        ),
        path,
      );
    }
    default: {
      return EMPTY_SEQUENCE;
    }
  }
};
