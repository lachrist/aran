import { drillDeepSite, drillSite } from "../site.mjs";
import { flat, mapIndex } from "../../util/index.mjs";
import { listEffectStatement } from "../node.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { warnGuard } from "../warning.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  flatSequence,
  liftSequenceX,
  liftSequenceX_,
} from "../../sequence.mjs";

/**
 * @type {<N extends (
 *   | import("../../estree").ExportNamedDeclaration
 *   | import("../../estree").ExportDefaultDeclaration
 * )>(
 *   node: N,
 * ) => node is N & {
 *   declaration: import("../../estree").Declaration,
 * }}
 */
const hasDeclaration = (node) => node.declaration != null;

/**
 * @type {(
 *   node: import("../../estree").FunctionDeclaration,
 * ) => node is import("../../estree").FunctionDeclaration & {
 *   id: import("../../estree").Identifier,
 * }}
 */
const hasFunctionId = (node) => node.id != null;

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *     | import("../../estree").SwitchCase
 *   )>,
 *   coscope: import("../scope").Scope,
 *   options: {
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     parent: "block" | "closure" | "program",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildHoistedStatement = (
  { node, path, meta },
  scope,
  { hoisting, parent },
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
              { hoisting, parent },
            ),
          ),
        ),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(
        drillSite(node, path, meta, "body"),
        scope,
        { hoisting, parent },
      );
    }
    case "ExportNamedDeclaration": {
      return hasDeclaration(node)
        ? unbuildHoistedStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            { hoisting, parent },
          )
        : EMPTY_SEQUENCE;
    }
    case "ExportDefaultDeclaration": {
      return hasDeclaration(node)
        ? unbuildHoistedStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            { hoisting, parent },
          )
        : EMPTY_SEQUENCE;
    }
    case "FunctionDeclaration": {
      const mode = getMode(scope);
      return hasFunctionId(node)
        ? liftSequenceX_(
            listEffectStatement,
            bindSequence(
              warnGuard(
                parent === "block" && mode === "sloppy",
                {
                  name: "SloppyBlockFunctionDeclaration",
                  message:
                    "Sloppy function declarations in blocks are non-standard",
                  path,
                },
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
          )
        : EMPTY_SEQUENCE;
    }
    default: {
      return EMPTY_SEQUENCE;
    }
  }
};
