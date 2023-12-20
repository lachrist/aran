import { drill, drillArray } from "../site.mjs";
import { flatMap, guard, map } from "../../util/index.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeEffectStatement,
  makePrimitiveExpression,
  tellLog,
} from "../node.mjs";
import { isDeclarationSite, isNotNullishSite } from "../predicate.mjs";
import { listScopeInitializeEffect } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<(
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *     | estree.SwitchCase
 *   )>,
 *   coscope: import("../scope").Scope,
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
        : map(
            listScopeInitializeEffect(
              { path, meta: metas.initialize },
              context,
              {
                variable: /** @type {estree.Variable} */ (node.id.name),
                right: guard(
                  parent === "block" && context.mode === "sloppy",
                  (node) =>
                    tellLog(node, {
                      name: "SloppyBlockFunctionDeclaration",
                      message:
                        "Sloppy function declarations in blocks are non-standard",
                    }),
                  unbuildFunction({ node, path, meta: metas.drill }, context, {
                    type: "function",
                    name: makePrimitiveExpression(node.id.name, path),
                  }),
                ),
              },
            ),
            (node) => makeEffectStatement(node, path),
          );
    }
    default: {
      return [];
    }
  }
};
