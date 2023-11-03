import { drill, drillAll, drillArray } from "../../drill.mjs";
import { flatMap, guard } from "../../util/index.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  hasDeclarationExportDefaultDeclaration,
  hasDeclarationExportNamedDeclaration,
} from "../predicate.mjs";
import { logBlockFunctionDeclaration } from "../report.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/hoisted.mjs");

/**
 * @type {(
 *   pair: {
 *     node: estree.Statement | estree.ModuleDeclaration | estree.SwitchCase,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     parent: "block" | "closure" | "program",
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildHoistedStatement = (
  { node, path },
  context,
  { parent },
) => {
  switch (node.type) {
    case "SwitchCase": {
      return flatMap(
        drillAll(drillArray({ node, path }, "consequent")),
        (pair) => unbuildHoistedStatement(pair, context, { parent }),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(drill({ node, path }, "body"), context, {
        parent,
      });
    }
    case "ExportNamedDeclaration": {
      return hasDeclarationExportNamedDeclaration(node)
        ? unbuildHoistedStatement(
            drill({ node, path }, "declaration"),
            context,
            {
              parent,
            },
          )
        : [];
    }
    case "ExportDefaultDeclaration": {
      return hasDeclarationExportDefaultDeclaration(node)
        ? unbuildHoistedStatement(
            drill({ node, path }, "declaration"),
            context,
            {
              parent,
            },
          )
        : [];
    }
    case "FunctionDeclaration": {
      return node.id === null
        ? []
        : listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            {
              var: mangleMetaVariable(
                LOCATION,
                /** @type {__unique} */ ("function_right"),
                path,
              ),
              val: guard(
                parent === "block",
                logBlockFunctionDeclaration,
                unbuildFunction({ node, path }, context, {
                  type: "function",
                  name: ANONYMOUS,
                }),
              ),
            },
            path,
          );
    }
    default: {
      return [];
    }
  }
};
