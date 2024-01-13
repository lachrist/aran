import { AranTypeError } from "../../../error.mjs";
import { map, reduceEntry, hasOwn, filter } from "../../../util/index.mjs";
import { isDeadzoneHoist, isLifespanHoist } from "../../query/index.mjs";
import { mapSequence, flatSequence } from "../../sequence.mjs";
import {
  bindDeadzone,
  listDeadzoneSaveEffect,
  makeDeadzoneLoadExpression,
} from "./deadzone.mjs";
import {
  bindLifespan,
  listLifespanSaveEffect,
  makeLifespanLoadExpression,
} from "./lifespan.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   hoisting: (
 *     | import("../../query/hoist").LifespanHoist
 *     | import("../../query/hoist").DeadzoneHoist
 *   )[],
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").ExternalFrame,
 * >}
 */
export const setupExternalFrame = ({ path, meta }, hoisting, { mode }) =>
  mapSequence(
    flatSequence(
      map(hoisting, (hoist) => {
        if (isLifespanHoist(hoist)) {
          return bindLifespan({ path }, hoist, { mode, deep: false });
        } else if (isDeadzoneHoist(hoist)) {
          return bindDeadzone({ path, meta }, hoist, { mode });
        } else {
          throw new AranTypeError(hoist);
        }
      }),
    ),
    (entries) => ({
      type: "external",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").ExternalFrame,
 *   hoisting: import("../../query/hoist").LifespanHoist[],
 *   options: {
 *     mode: "sloppy"
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").ExternalFrame,
 * >}
 */
export const updateExternalFrame = ({ path }, frame, hoisting, { mode }) =>
  mapSequence(
    flatSequence(
      map(
        filter(hoisting, ({ variable }) => !hasOwn(frame.record, variable)),
        (hoist) => bindLifespan({ path }, hoist, { mode, deep: true }),
      ),
    ),
    (entries) => ({
      type: /** @type {"external"} */ ("external"),
      record: {
        ...frame.record,
        ...reduceEntry(entries),
      },
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").ExternalFrame,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence | null}
 */
export const makeExternalLoadExpression = (site, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (
      binding.kind === "let" ||
      binding.kind === "const" ||
      binding.kind === "class"
    ) {
      return makeDeadzoneLoadExpression(site, binding, operation);
    } else if (binding.kind === "var" || binding.kind === "function") {
      return makeLifespanLoadExpression(site, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").ExternalFrame,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence | null}
 */
export const listExternalSaveEffect = (site, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (
      binding.kind === "let" ||
      binding.kind === "const" ||
      binding.kind === "class"
    ) {
      return listDeadzoneSaveEffect(site, binding, operation);
    } else if (binding.kind === "var" || binding.kind === "function") {
      return listLifespanSaveEffect(site, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};
