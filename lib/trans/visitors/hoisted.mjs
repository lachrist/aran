import {
  map,
  EMPTY_SEQUENCE,
  callSequence___X,
  flatSequence,
  liftSequenceX_,
} from "../../util/index.mjs";
import { listEffectStatement } from "../node.mjs";
import {
  listWriteVariableEffect,
  makeInitVariableOperation,
} from "../scope/index.mjs";
import { transFunction } from "./function.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { PLAIN_CLOSURE } from "../closure.mjs";

/**
 * @type {(
 *   site: (
 *     | import("estree-sentry").Statement<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").ModuleDeclaration<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").SwitchCase<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
 * >}
 */
export const transHoistedStatement = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "SwitchCase": {
      return flatSequence(
        map(node.consequent, (node) =>
          transHoistedStatement(node, forkMeta((meta = nextMeta(meta))), scope),
        ),
      );
    }
    case "LabeledStatement": {
      return transHoistedStatement(node.body, meta, scope);
    }
    case "ExportNamedDeclaration": {
      return node.declaration != null
        ? transHoistedStatement(node.declaration, meta, scope)
        : EMPTY_SEQUENCE;
    }
    case "ExportDefaultDeclaration": {
      return node.declaration != null &&
        (node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration") &&
        node.declaration.id != null
        ? transHoistedStatement(node.declaration, meta, scope)
        : EMPTY_SEQUENCE;
    }
    case "FunctionDeclaration": {
      return liftSequenceX_(
        listEffectStatement,
        callSequence___X(
          listWriteVariableEffect,
          hash,
          forkMeta((meta = nextMeta(meta))),
          scope,
          callSequence___X(
            makeInitVariableOperation,
            hash,
            scope.mode,
            node.id.name,
            transFunction(
              node,
              forkMeta((meta = nextMeta(meta))),
              scope,
              PLAIN_CLOSURE,
              { type: "assignment", variable: node.id.name },
            ),
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
