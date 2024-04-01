import { AranError } from "../../../error.mjs";
import { concat_ } from "../../../util/index.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import {
  liftSequenceX,
  liftSequenceX_,
  zeroSequence,
} from "../../sequence.mjs";
import { makeThrowConstantExpression, reportDuplicate } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     estree.Variable,
 *     import(".").ImportBinding,
 *   ],
 * ) => never[]}
 */
export const setupImportBinding = (_site, _entry) => [];

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ImportBinding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeImportLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      return zeroSequence(
        makeImportExpression(binding.source, binding.specifier, path),
      );
    }
    case "typeof": {
      return zeroSequence(
        makeUnaryExpression(
          "typeof",
          makeImportExpression(binding.source, binding.specifier, path),
          path,
        ),
      );
    }
    case "discard": {
      return zeroSequence(makePrimitiveExpression(false, path));
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
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listImportSaveEffect = ({ path }, _binding, operation) => {
  if (operation.type === "initialize") {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        makeEarlyErrorExpression(
          makeRegularEarlyError(reportDuplicate(operation.variable), path),
        ),
        path,
      ),
    );
  } else if (operation.type === "write") {
    return zeroSequence([
      makeExpressionEffect(
        makeThrowConstantExpression(operation.variable, path),
        path,
      ),
    ]);
  } else {
    throw new AranError("invalid save operation", operation);
  }
};
