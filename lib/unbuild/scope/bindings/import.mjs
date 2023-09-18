import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../node.mjs";

import { makeUnaryExpression } from "../../intrinsic.mjs";

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
  listBindingDeclareStatement: (_strict, _binding, _variable, _tag) => [],
  listBindingInitializeStatement: (_strict, _binding, _variable, _tag) => [],
  makeBindingReadExpression: (_strict, binding, _variable, tag) =>
    makeImportExpression(binding.source, binding.specifier, tag),
  makeBindingTypeofExpression: (_strict, binding, _variable, tag) =>
    makeUnaryExpression(
      "typeof",
      makeImportExpression(binding.source, binding.specifier, tag),
      tag,
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable, tag) =>
    makePrimitiveExpression(false, tag),
  listBindingWriteEffect: (_strict, _binding, variable, _pure, tag) => [
    makeExpressionEffect(makeThrowConstantExpression(variable, tag), tag),
  ],
};
