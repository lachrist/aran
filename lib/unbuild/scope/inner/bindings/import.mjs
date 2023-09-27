import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";

import { makeUnaryExpression } from "../../../intrinsic.mjs";

import { makeThrowConstantExpression } from "../error.mjs";

/**
 * @typedef {{
 *   type: "import";
 *   source: estree.Source;
 *   specifier: estree.Specifier | null;
 *}} ImportBinding
 */

/**
 * @template T
 * @type {import("./module.js").BindingModule<ImportBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, _variable, _serial) => [],
  listBindingInitializeStatement: (_strict, _binding, _variable, _serial) => [],
  makeBindingReadExpression: (_strict, binding, _variable, serial) =>
    makeImportExpression(binding.source, binding.specifier, serial),
  makeBindingTypeofExpression: (_strict, binding, _variable, serial) =>
    makeUnaryExpression(
      "typeof",
      makeImportExpression(binding.source, binding.specifier, serial),
      serial,
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, serial) =>
    makePrimitiveExpression(false, serial),
  listBindingWriteEffect: (_strict, _binding, variable, _pure, serial) => [
    makeExpressionEffect(makeThrowConstantExpression(variable, serial), serial),
  ],
};
