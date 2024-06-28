import { AranTypeError } from "../../../error.mjs";
import {
  EMPTY,
  flatMap,
  hasOwn,
  map,
  reduceEntry,
} from "../../../util/index.mjs";
import { initSequence } from "../../../sequence.mjs";
import { hasPatternVariable } from "../../query/index.mjs";
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
          specifiers[specifiers.length] =
            /** @type {import("../../../estree").Specifier} */ (
              specifier.exported.name
            );
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
      specifiers[specifiers.length] =
        /** @type {import("../../../estree").Specifier} */ ("default");
    }
  }
  return specifiers;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   binding: import("../../query/hoist2").Binding,
 *   root: import("../../../estree").Program,
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").RegularBinding
 * ]}
 */
const toModuleBindingEntry = (binding, root) => {
  if (binding.type === "internal") {
    return [
      binding.variable,
      {
        type: "internal",
        baseline: binding.baseline,
        write: binding.write,
        export: listExportSpecifier(binding.variable, root),
      },
    ];
  } else if (binding.type === "external") {
    return [
      binding.variable,
      {
        type: "external",
        source: binding.source,
        specifier: binding.specifier,
      },
    ];
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {(
 *   binding: import("../../query/hoist2").Binding,
 * ) => [
 *   import("../../../estree").Variable,
 *   import(".").RegularBinding
 * ]}
 */
const toBindingEntry = (binding) => {
  if (binding.type === "internal") {
    return [
      binding.variable,
      {
        type: "internal",
        baseline: binding.baseline,
        write: binding.write,
        export: EMPTY,
      },
    ];
  } else if (binding.type === "external") {
    return [
      binding.variable,
      {
        type: "external",
        source: binding.source,
        specifier: binding.specifier,
      },
    ];
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   bindings: import("../../query/hoist2").Binding[],
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
 *   site: import("../../site").Site<
 *     import("../../../estree").Program,
 *   >,
 *   bindings: import("../../query/hoist2").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BaseDeclarationPrelude,
 *   import(".").RegularFrame
 * >}
 */
export const setupModuleFrame = ({ node, path }, hoisting) => {
  const entries = map(hoisting, (hoist) => toModuleBindingEntry(hoist, node));
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
