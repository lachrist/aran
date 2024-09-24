import { flat, map } from "../../util/index.mjs";
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
import { digest } from "../annotation/index.mjs";

/**
 * @type {(
 *   site: (
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *     | import("../../estree").SwitchCase
 *   ),
 *   meta: import("../meta").Meta,
 *   context: {
 *     annotation: import("../annotation").Annotation,
 *     scope: import("../scope").Scope,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildHoistedStatement = (node, meta, { scope, annotation }) => {
  const hash = digest(node, annotation);
  switch (node.type) {
    case "SwitchCase": {
      return liftSequenceX(
        flat,
        flatSequence(
          map(node.consequent, (node) =>
            unbuildHoistedStatement(node, forkMeta((meta = nextMeta(meta))), {
              scope,
              annotation,
            }),
          ),
        ),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(node.body, meta, { scope, annotation });
    }
    case "ExportNamedDeclaration": {
      return node.declaration != null
        ? unbuildHoistedStatement(node.declaration, meta, { scope, annotation })
        : EMPTY_SEQUENCE;
    }
    case "ExportDefaultDeclaration": {
      return node.declaration != null &&
        (node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration") &&
        node.declaration.id != null
        ? unbuildHoistedStatement(node.declaration, meta, { scope, annotation })
        : EMPTY_SEQUENCE;
    }
    case "FunctionDeclaration": {
      const mode = getMode(scope);
      return liftSequenceX_(
        listEffectStatement,
        bindSequence(
          unbuildFunction(node, forkMeta((meta = nextMeta(meta))), {
            scope,
            annotation,
            type: "function",
            name: {
              type: "assignment",
              variable: /** @type {import("../../estree").Variable} */ (
                node.id.name
              ),
            },
          }),
          (right) =>
            listScopeSaveEffect(
              hash,
              forkMeta((meta = nextMeta(meta))),
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
        hash,
      );
    }
    default: {
      return EMPTY_SEQUENCE;
    }
  }
};
