import { hasOwn, map, pairup } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
} from "../../node.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { AranTypeError } from "../../../error.mjs";
import { initSequence } from "../../sequence.mjs";
import { makeEffectPrelude, makeDeclarationPrelude } from "../../prelude.mjs";
import { makeEarlyErrorExpression } from "../../early-error.mjs";
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
 * ) => import("../../sequence.js").PreludeSequence<[
 *   estree.Variable,
 *   import(".").BlockBinding
 * ]>}
 */
export const setupHoistingBinding = ({ path }, [variable, kind], link) =>
  initSequence(
    [
      makeDeclarationPrelude(mangleBaseVariable(variable)),
      makeEffectPrelude(
        makeWriteBaseEffect(
          mangleBaseVariable(variable),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
      ),
    ],
    pairup(variable, {
      kind,
      export:
        link !== null && hasOwn(link.export, variable)
          ? link.export[variable]
          : [],
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listHoistingSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "initialize") {
    if (binding.kind === operation.kind) {
      if (operation.right === null) {
        return [];
      } else {
        return [
          makeWriteBaseEffect(
            mangleBaseVariable(operation.variable),
            makeReadCacheExpression(operation.right, path),
            path,
          ),
          ...map(binding.export, (specifier) =>
            makeExportEffect(
              specifier,
              makeReadBaseExpression(
                mangleBaseVariable(operation.variable),
                path,
              ),
              path,
            ),
          ),
        ];
      }
    } else {
      return [
        makeExpressionEffect(
          makeEarlyErrorExpression(reportDuplicate(operation.variable), path),
          path,
        ),
      ];
    }
  } else if (operation.type === "write") {
    return [
      makeWriteBaseEffect(
        mangleBaseVariable(operation.variable),
        makeReadCacheExpression(operation.right, path),
        path,
      ),
      ...map(binding.export, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
          path,
        ),
      ),
    ];
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").HoistingBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHoistingLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeReadBaseExpression(
        mangleBaseVariable(operation.variable),
        path,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
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
