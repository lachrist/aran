import { drill, drillAll, drillArray } from "../../drill.mjs";
import { flatMap, guard } from "../../util/index.mjs";
import { forkMeta, splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  hasDeclarationExportDefaultDeclaration,
  hasDeclarationExportNamedDeclaration,
} from "../predicate.mjs";
import { logBlockFunctionDeclaration } from "../report.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Statement | estree.ModuleDeclaration | estree.SwitchCase,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *     parent: "block" | "closure" | "program",
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildHoistedStatement = (
  { node, path },
  context,
  { meta, parent },
) => {
  switch (node.type) {
    case "SwitchCase": {
      return flatMap(
        drillAll(drillArray({ node, path }, "consequent")),
        (pair) => unbuildHoistedStatement(pair, context, { meta, parent }),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(drill({ node, path }, "body"), context, {
        meta,
        parent,
      });
    }
    case "ExportNamedDeclaration": {
      return hasDeclarationExportNamedDeclaration(node)
        ? unbuildHoistedStatement(
            drill({ node, path }, "declaration"),
            context,
            { meta, parent },
          )
        : [];
    }
    case "ExportDefaultDeclaration": {
      return hasDeclarationExportDefaultDeclaration(node)
        ? unbuildHoistedStatement(
            drill({ node, path }, "declaration"),
            context,
            { meta, parent },
          )
        : [];
    }
    case "FunctionDeclaration": {
      const metas = splitMeta(meta, ["function", "initialize"]);
      return node.id === null
        ? []
        : listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            guard(
              parent === "block",
              logBlockFunctionDeclaration,
              unbuildFunction({ node, path }, context, {
                meta: forkMeta(metas.function),
                type: "function",
                name: ANONYMOUS,
              }),
            ),
            path,
            forkMeta(metas.initialize),
          );
    }
    default: {
      return [];
    }
  }
};
