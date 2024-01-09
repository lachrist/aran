import { drillDeepSite, drillSite } from "../site.mjs";
import { mapIndex } from "../../util/index.mjs";
import {
  EMPTY_STATEMENT,
  concatStatement,
  makeEffectStatement,
} from "../node.mjs";
import { getMode, listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { bindSequence } from "../sequence.mjs";
import { cacheConstant } from "../cache.mjs";
import { AranTypeError } from "../../error.mjs";
import { warnGuard } from "../warning.mjs";

/**
 * @type {<N extends (
 *   | estree.ExportNamedDeclaration
 *   | estree.ExportDefaultDeclaration
 * )>(
 *   node: N,
 * ) => node is N & {
 *   declaration: estree.Declaration,
 * }}
 */
const hasDeclaration = (node) => node.declaration != null;

/**
 * @type {(
 *   node: estree.FunctionDeclaration,
 * ) => node is estree.FunctionDeclaration & {
 *   id: estree.Identifier,
 * }}
 */
const hasFunctionId = (node) => node.id != null;

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 * ) => "var" | "let"}
 */
const getFunctionKind = (mode) => {
  if (mode === "strict") {
    return "let";
  } else if (mode === "sloppy") {
    return "var";
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *     | estree.SwitchCase
 *   )>,
 *   coscope: import("../scope").Scope,
 *   options: {
 *     parent: "block" | "closure" | "program",
 *   },
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildHoistedStatement = (
  { node, path, meta },
  scope,
  { parent },
) => {
  switch (node.type) {
    case "SwitchCase": {
      return concatStatement(
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
            { parent },
          ),
        ),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(
        drillSite(node, path, meta, "body"),
        scope,
        { parent },
      );
    }
    case "ExportNamedDeclaration": {
      return hasDeclaration(node)
        ? unbuildHoistedStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            { parent },
          )
        : EMPTY_STATEMENT;
    }
    case "ExportDefaultDeclaration": {
      return hasDeclaration(node)
        ? unbuildHoistedStatement(
            drillSite(node, path, meta, "declaration"),
            scope,
            { parent },
          )
        : EMPTY_STATEMENT;
    }
    case "FunctionDeclaration": {
      const mode = getMode(scope);
      return hasFunctionId(node)
        ? makeEffectStatement(
            bindSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
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
                        variable: /** @type {estree.Variable} */ (node.id.name),
                      },
                    },
                  ),
                ),
                path,
              ),
              (right) =>
                listScopeSaveEffect(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  {
                    type: "initialize",
                    kind: getFunctionKind(mode),
                    variable: /** @type {estree.Variable} */ (node.id.name),
                    mode,
                    right,
                  },
                ),
            ),
            path,
          )
        : EMPTY_STATEMENT;
    }
    default: {
      return EMPTY_STATEMENT;
    }
  }
};
