import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../syntax.mjs";

import { makeUnaryExpression } from "../../intrinsic.mjs";

import { makeThrowConstantExpression } from "../error.mjs";

/**
 * @template T
 * @type {BindingModule<ImportBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, _variable) => [],
  listBindingInitializeStatement: (_strict, _binding, _variable) => [],
  makeBindingReadExpression: (_strict, binding, _variable) =>
    makeImportExpression(binding.source, binding.specifier),
  makeBindingTypeofExpression: (_strict, binding, _variable) =>
    makeUnaryExpression(
      "typeof",
      makeImportExpression(binding.source, binding.specifier),
    ),
  makeBindingDiscardExpression: (_strict, _binding, _variable) =>
    makePrimitiveExpression(false),
  listBindingWriteEffect: (_strict, _binding, variable, _pure) => [
    makeExpressionEffect(makeThrowConstantExpression(variable)),
  ],
};
