import { AranTypeError } from "../../../error.mjs";
import { flatMap, hasOwn, map, reduceEntry } from "../../../util/index.mjs";
import { initSequence } from "../../../sequence.mjs";
import {
  DEFAULT_SPECIFIER,
  getSpecifier,
  hasPatternVariable,
} from "../../query/index.mjs";
import {
  listBindingSaveEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   variable: import("../../../estree").Variable,
 *   root: import("../../../estree").Program,
 * ) => import("../../../estree").Specifier[]}
 */
const listExportSpecifier = (variable, root) => {
  /** @type {import("../../../estree").Specifier[]} */
  const specifiers = [];
  for (const node of root.body) {
    if (node.type === "ExportNamedDeclaration") {
      for (const specifier of node.specifiers) {
        if (specifier.local.name === variable) {
          specifiers[specifiers.length] = getSpecifier(specifier.exported);
        }
      }
      if (node.declaration != null) {
        if (node.declaration.type === "VariableDeclaration") {
          for (const declarator of node.declaration.declarations) {
            if (hasPatternVariable(declarator.id, variable)) {
              specifiers[specifiers.length] =
                /** @type {import("../../../estree").Specifier} */ (
                  /** @type {unknown} */ (variable)
                );
            }
          }
        } else if (
          node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration"
        ) {
          if (
            node.declaration.id != null &&
            node.declaration.id.name === variable
          ) {
            specifiers[specifiers.length] =
              /** @type {import("../../../estree").Specifier} */ (
                /** @type {unknown} */ (variable)
              );
          }
        } else {
          throw new AranTypeError(node.declaration);
        }
      }
    }
    if (
      node.type === "ExportDefaultDeclaration" &&
      (node.declaration.type === "FunctionDeclaration" ||
        node.declaration.type === "ClassDeclaration") &&
      node.declaration.id != null &&
      node.declaration.id.name === variable
    ) {
      specifiers[specifiers.length] = DEFAULT_SPECIFIER;
    }
  }
  return specifiers;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   binding: import("../../query/hoist-public").Binding,
 *   root: import("../../../estree").ModuleProgram,
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").Binding
 * ]}
 */
const toModuleBindingEntry = (binding, root) => {
  if (binding.baseline === "import") {
    return [
      binding.variable,
      {
        baseline: binding.baseline,
        write: binding.write,
        export: null,
        import: binding.import,
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
        export: listExportSpecifier(binding.variable, root),
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
    return [
      binding.variable,
      {
        baseline: "import",
        import: binding.import,
        write: binding.write,
        export: null,
      },
    ];
  } else if (
    binding.baseline === "undefined" ||
    binding.baseline === "deadzone"
  ) {
    return [
      binding.variable,
      {
        baseline: binding.baseline,
        import: binding.import,
        write: binding.write,
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
 *   binding: import("../../query/hoist-public").Binding,
 *   root: import("../../../estree").Program,
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").Binding
 * ]}
 */
const toProgramBindingEntry = (binding, root) => {
  switch (root.sourceType) {
    case "module": {
      return toModuleBindingEntry(
        binding,
        /** @type {import("../../../estree").ModuleProgram} */ (root),
      );
    }
    case "script": {
      return toBindingEntry(binding);
    }
    default: {
      throw new AranTypeError(root.sourceType);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: import("../../../path").Path,
 *     node: import("../../../estree").Program,
 *   },
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BaseDeclarationPrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupProgramFrame = ({ node, path }, bindings) => {
  const entries = map(bindings, (binding) =>
    toProgramBindingEntry(binding, node),
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
