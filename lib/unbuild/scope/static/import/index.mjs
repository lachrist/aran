import { AranError } from "../../../../error.mjs";
import { makeUnaryExpression } from "../../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { makeThrowConstantExpression } from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").ImportBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").ImportBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listImportSaveEffect = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "initialize": {
      throw new AranError(
        "import variable should not be initialized",
        operation,
      );
    }
    case "write": {
      return [
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
        ),
      ];
    }
    default: {
      throw new AranError("invalid save operation", operation);
    }
  }
};
