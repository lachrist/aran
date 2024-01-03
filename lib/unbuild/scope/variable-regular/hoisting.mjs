import { hasOwn, map, pairup } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../../node.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { AranTypeError } from "../../../error.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  concatAllSequence,
  initSequence,
} from "../../sequence.mjs";
import { makeEffectPrelude, makeDeclarationPrelude } from "../../prelude.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";
import { reportDuplicate } from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entries: [
 *     estree.Variable,
 *     import(".").HoistingKind,
 *   ],
 *   link: null | {
 *     export: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../sequence").SetupSequence<[
 *   estree.Variable,
 *   import(".").RegularBinding
 * ]>}
 */
export const setupHoistingBinding = ({ path }, [variable, kind], link) =>
  bindSequence(
    makeWriteEffect(
      mangleBaseVariable(variable),
      makePrimitiveExpression({ undefined: null }, path),
      path,
    ),
    (setup) =>
      initSequence(
        [
          makeDeclarationPrelude(mangleBaseVariable(variable)),
          ...map(setup, makeEffectPrelude),
        ],
        pairup(variable, {
          kind,
          export:
            link !== null && hasOwn(link.export, variable)
              ? link.export[variable]
              : [],
        }),
      ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listHoistingSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "initialize") {
    if (binding.kind === operation.kind) {
      if (operation.right === null) {
        return EMPTY_SEQUENCE;
      } else {
        return concatAllSequence([
          makeWriteEffect(
            mangleBaseVariable(operation.variable),
            makeReadCacheExpression(operation.right, path),
            path,
          ),
          ...map(binding.export, (specifier) =>
            makeExportEffect(
              specifier,
              makeReadExpression(mangleBaseVariable(operation.variable), path),
              path,
            ),
          ),
        ]);
      }
    } else {
      return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
    }
  } else if (operation.type === "write") {
    return concatAllSequence([
      makeWriteEffect(
        mangleBaseVariable(operation.variable),
        makeReadCacheExpression(operation.right, path),
        path,
      ),
      ...map(binding.export, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadExpression(mangleBaseVariable(operation.variable), path),
          path,
        ),
      ),
    ]);
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeHoistingLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeReadExpression(mangleBaseVariable(operation.variable), path);
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeReadExpression(mangleBaseVariable(operation.variable), path),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};
