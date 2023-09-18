import { reportLimitation } from "../../../limitation.mjs";

import {
  makeDeclareEnclaveStatement,
  makePrimitiveExpression,
  makeReadEnclaveExpression,
  makeReadExpression,
  makeTypeofEnclaveExpression,
  makeWriteEnclaveEffect,
} from "../../../node.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @typedef {{
 *   type: "external";
 *   kind: "var" | "let" | "const";
 * }} ExternalBinding;
 */

/**
 * @template T
 * @type {import("./module.js").BindingModule<ExternalBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, _variable, _tag) => [],
  listBindingInitializeStatement: (
    _strict,
    binding,
    variable,
    expression,
    tag,
  ) => [makeDeclareEnclaveStatement(binding.kind, variable, expression, tag)],
  makeBindingReadExpression: (_strict, _binding, variable, tag) =>
    makeReadEnclaveExpression(variable, tag),
  makeBindingTypeofExpression: (_strict, _binding, variable, tag) =>
    makeTypeofEnclaveExpression(variable, tag),
  makeBindingDiscardExpression: (_strict, _binding, variable, tag) => {
    reportLimitation(
      `ignoring external variable deletion ${stringifyJSON(variable)}`,
    );
    return makePrimitiveExpression(false, tag);
  },
  listBindingWriteEffect: (strict, _binding, variable, pure, tag) => {
    if (!strict) {
      reportLimitation(
        `turning strict sloppy external variable assignment ${stringifyJSON(
          variable,
        )}`,
      );
    }
    return [
      makeWriteEnclaveEffect(variable, makeReadExpression(pure, tag), tag),
    ];
  },
};
