import { flat, map } from "../../util/index.mjs";
import { listEffectStatement } from "../node.mjs";
import { listScopeSaveEffect } from "../scope/index.mjs";
import { unbuildFunction } from "./function.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  flatSequence,
  liftSequenceX,
  liftSequenceX_,
} from "../../sequence.mjs";
import { FUNCTION_PARAM } from "../param.mjs";

/**
 * @type {(
 *   site: (
 *     | import("estree-sentry").Statement<import("../../hash").HashProp>
 *     | import("estree-sentry").ModuleDeclaration<import("../../hash").HashProp>
 *     | import("estree-sentry").SwitchCase<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildHoistedStatement = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "SwitchCase": {
      return liftSequenceX(
        flat,
        flatSequence(
          map(node.consequent, (node) =>
            unbuildHoistedStatement(
              node,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
          ),
        ),
      );
    }
    case "LabeledStatement": {
      return unbuildHoistedStatement(node.body, meta, scope);
    }
    case "ExportNamedDeclaration": {
      return node.declaration != null
        ? unbuildHoistedStatement(node.declaration, meta, scope)
        : EMPTY_SEQUENCE;
    }
    case "ExportDefaultDeclaration": {
      return node.declaration != null &&
        (node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration") &&
        node.declaration.id != null
        ? unbuildHoistedStatement(node.declaration, meta, scope)
        : EMPTY_SEQUENCE;
    }
    case "FunctionDeclaration": {
      const mode = scope.mode;
      return liftSequenceX_(
        listEffectStatement,
        bindSequence(
          unbuildFunction(
            node,
            forkMeta((meta = nextMeta(meta))),
            scope,
            FUNCTION_PARAM,
            { type: "assignment", variable: node.id.name },
          ),
          (right) =>
            listScopeSaveEffect(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope.scope,
              {
                type: "initialize",
                variable: node.id.name,
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
