import { AranError } from "../../../error.mjs";
import { hasOwn, pairup } from "../../../util/index.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { zeroSequence } from "../../sequence.mjs";
import { makeThrowConstantExpression, reportDuplicate } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     estree.Variable,
 *     import(".").ImportKind,
 *   ],
 *   link: null | {
 *     import: Record<estree.Variable, {
 *       source: estree.Source,
 *       specifier: estree.Specifier | null,
 *     }>,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   [
 *     estree.Variable,
 *     import(".").RegularBinding
 *   ],
 * >}
 */
export const setupImportBinding = (_site, [variable, kind], link) => {
  if (link !== null && hasOwn(link.import, variable)) {
    const { source, specifier } = link.import[variable];
    return zeroSequence(pairup(variable, { kind, source, specifier }));
  } else {
    throw new AranError("missing import variable", { kind, variable, link });
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ImportBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeImportLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeImportExpression(binding.source, binding.specifier, path);
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeImportExpression(binding.source, binding.specifier, path),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranError("invalid load operation", operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ImportBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listImportSaveEffect = ({ path }, _binding, operation) => {
  if (operation.type === "initialize") {
    return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
  } else if (operation.type === "write") {
    return makeExpressionEffect(
      makeThrowConstantExpression(operation.variable, path),
      path,
    );
  } else {
    throw new AranError("invalid save operation", operation);
  }
};
