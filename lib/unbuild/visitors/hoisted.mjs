import { drill, drillArray } from "../site.mjs";
import { flatMap, guard } from "../../util/index.mjs";
import { splitMeta } from "../mangle.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { isDeclarationSite, isNotNullishSite } from "../predicate.mjs";
import { logBlockFunctionDeclaration } from "../report.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<(
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *     | estree.SwitchCase
 *   )>,
 *   context: import("../context.js").Context,
 *   options: {
 *     parent: "block" | "closure" | "program",
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildHoistedStatement = (
  { node, path, meta },
  context,
  { parent },
) => {
  switch (node.type) {
    case "SwitchCase": {
      const sites = drill({ node, path, meta }, ["consequent"]);
      return flatMap(drillArray(sites.consequent), (site) =>
        unbuildHoistedStatement(site, context, { parent }),
      );
    }
    case "LabeledStatement": {
      const sites = drill({ node, path, meta }, ["body"]);
      return unbuildHoistedStatement(sites.body, context, { parent });
    }
    case "ExportNamedDeclaration": {
      const sites = drill({ node, path, meta }, ["declaration"]);
      return isNotNullishSite(sites.declaration)
        ? unbuildHoistedStatement(sites.declaration, context, { parent })
        : [];
    }
    case "ExportDefaultDeclaration": {
      const sites = drill({ node, path, meta }, ["declaration"]);
      return isDeclarationSite(sites.declaration)
        ? unbuildHoistedStatement(sites.declaration, context, { parent })
        : [];
    }
    case "FunctionDeclaration": {
      const metas = splitMeta(meta, ["drill", "initialize"]);
      return node.id === null
        ? []
        : listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            guard(
              parent === "block",
              logBlockFunctionDeclaration,
              unbuildFunction({ node, path, meta: metas.drill }, context, {
                type: "function",
                name: makePrimitiveExpression(node.id.name, path),
              }),
            ),
            path,
            metas.initialize,
          );
    }
    default: {
      return [];
    }
  }
};
