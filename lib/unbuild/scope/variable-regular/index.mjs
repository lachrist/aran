import { AranError, AranTypeError } from "../../../error.mjs";
import { flatMap, hasOwn, map, reduceEntry } from "../../../util/index.mjs";
import { initSequence } from "../../../sequence.mjs";
import { findVariableImport, listVariableExport } from "../../query/index.mjs";
import {
  listBindingSaveEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";

/**
 * @type {(
 *   binding: import("../../query/hoist-public").Binding,
 *   links: import("../../query/link").Link[],
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").Binding
 * ]}
 */
const toProgramBindingEntry = (binding, links) => {
  if (binding.baseline === "import") {
    return [
      binding.variable,
      {
        baseline: binding.baseline,
        write: binding.write,
        import: findVariableImport(links, binding.variable),
        export: null,
      },
    ];
  } else if (
    binding.baseline === "deadzone" ||
    binding.baseline === "undefined"
  ) {
    return [
      binding.variable,
      {
        baseline: binding.baseline,
        write: binding.write,
        import: null,
        export: listVariableExport(links, binding.variable),
      },
    ];
  } else {
    throw new AranTypeError(binding.baseline);
  }
};

/**
 * @type {(
 *   binding: import("../../query/hoist-public").Binding,
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").Binding
 * ]}
 */
const toBindingEntry = (binding) => {
  if (binding.baseline === "import") {
    throw new AranError("import variable in non-module frame", { binding });
  } else if (
    binding.baseline === "undefined" ||
    binding.baseline === "deadzone"
  ) {
    return [
      binding.variable,
      {
        baseline: binding.baseline,
        write: binding.write,
        import: null,
        export: [],
      },
    ];
  } else {
    throw new AranTypeError(binding.baseline);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BaseDeclarationPrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = ({ path }, bindings) => {
  const entries = map(bindings, toBindingEntry);
  return initSequence(
    flatMap(entries, (entry) => setupBinding({ path }, entry)),
    {
      type: "regular",
      record: reduceEntry(entries),
    },
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   bindings: import("../../query/hoist-public").Binding[],
 *   links: import("../../query/link").Link[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BaseDeclarationPrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupProgramFrame = ({ path }, bindings, links) => {
  const entries = map(bindings, (binding) =>
    toProgramBindingEntry(binding, links),
  );
  return initSequence(
    flatMap(entries, (entry) => setupBinding({ path }, entry)),
    {
      type: "regular",
      record: reduceEntry(entries),
    },
  );
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeRegularLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return makeBindingLoadExpression(
      { path },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listRegularSaveEffect = ({ path, meta }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listBindingSaveEffect(
      { path, meta },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};
