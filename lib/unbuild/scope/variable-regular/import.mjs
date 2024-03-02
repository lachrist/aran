import { AranError } from "../../../error.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeThrowConstantExpression, reportDuplicate } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     estree.Variable,
 *     import(".").ImportBinding,
 *   ],
 * ) => import("../../prelude").BodyPrelude[]}
 */
export const setupImportBinding = (_site, _entry) => [];

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ImportBinding,
 *   operation: import("../operation").VariableLoadOperation,
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
 *   operation: import("../operation").VariableSaveOperation,
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
