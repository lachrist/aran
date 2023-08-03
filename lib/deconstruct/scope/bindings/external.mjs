import { reportLimitation } from "../../../limitation.mjs";

import {
  makeDeclareExternalStatement,
  makePrimitiveExpression,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
} from "../../../syntax.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @template T
 * @type {BindingModule<ExternalBinding, T>}
 */
export default {
  listBindingVariable: (_strict, _binding, _variable) => [],
  listBindingDeclareStatement: (_strict, _binding, _variable) => [],
  listBindingInitializeStatement: (_strict, binding, variable, expression) => [
    makeDeclareExternalStatement(binding.kind, variable, expression),
  ],
  makeBindingReadExpression: (_strict, _binding, variable) =>
    makeReadExternalExpression(variable),
  makeBindingTypeofExpression: (_strict, _binding, variable) =>
    makeTypeofExternalExpression(variable),
  makeBindingDiscardExpression: (_strict, _binding, variable) => {
    reportLimitation(
      `ignoring external variable deletion ${stringifyJSON(variable)}`,
    );
    return makePrimitiveExpression(false);
  },
  listBindingWriteEffect: (strict, _binding, variable, pure) => {
    if (!strict) {
      reportLimitation(
        `turning strict sloppy external variable assignment ${stringifyJSON(
          variable,
        )}`,
      );
    }
    return [makeWriteExternalEffect(variable, pure)];
  },
};
