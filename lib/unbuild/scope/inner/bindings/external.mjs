import { reportLimitation } from "../../../../limitation.mjs";

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
  listBindingDeclareStatement: (_strict, _binding, _variable, _serial) => [],
  listBindingInitializeStatement: (
    _strict,
    binding,
    variable,
    expression,
    serial,
  ) => [
    makeDeclareEnclaveStatement(binding.kind, variable, expression, serial),
  ],
  makeBindingReadExpression: (_strict, _binding, variable, serial) =>
    makeReadEnclaveExpression(variable, serial),
  makeBindingTypeofExpression: (_strict, _binding, variable, serial) =>
    makeTypeofEnclaveExpression(variable, serial),
  makeBindingDiscardExpression: (_strict, _binding, variable, serial) => {
    reportLimitation(
      `ignoring external variable deletion ${stringifyJSON(variable)}`,
    );
    return makePrimitiveExpression(false, serial);
  },
  listBindingWriteEffect: (strict, _binding, variable, pure, serial) => {
    if (!strict) {
      reportLimitation(
        `turning strict sloppy external variable assignment ${stringifyJSON(
          variable,
        )}`,
      );
    }
    return [
      makeWriteEnclaveEffect(
        variable,
        makeReadExpression(pure, serial),
        serial,
      ),
    ];
  },
};
