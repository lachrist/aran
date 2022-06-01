import {map} from "array-lite";

import {
  assert,
  constant,
  constant_,
  constant__,
  constant____,
  returnx_,
  return_x,
  return_x_,
  return__x_,
  return___x_,
  partialxxx__,
  dropx_,
  partialxx_,
  partial_x_,
  hasOwnProperty,
} from "../util/index.mjs";

import {
  fromLiteral,
  makeLiteralExpression,
  makeApplyExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeEffectStatement,
} from "../ast/index.mjs";

import {
  makeGetExpression,
  makeArrayExpression,
  makeJSONExpression,
} from "../intrinsic.mjs";

import {
  NEW_SPLIT,
  LAB_SPLIT,
  VAR_SPLIT,
  lookupSplitScope,
  makeSplitScopeReadExpression,
} from "./split.mjs";

import {cut} from "./cut.mjs";

const {
  undefined,
  Reflect: {apply},
} = globalThis;

////////////
// Helper //
////////////

const returnNull = constant(null);

const mapNull = (array) => map(array, returnNull);

const lookupAllScope = (scope, split, variables) =>
  map(variables, partialxx_(lookupSplitScope, scope, split));

const makeSplitScopeReadArrayExpression = (scope, split, variables) =>
  makeArrayExpression(
    map(variables, partialxx_(makeSplitScopeReadExpression, scope, split)),
  );

//////////////
// Argument //
//////////////

const expression_arg = [constant__(null), return_x];
const expression_array_arg = [dropx_(mapNull), dropx_(makeArrayExpression)];
const primitive_arg = [return_x, dropx_(makeLiteralExpression)];
const literal_arg = [dropx_(fromLiteral), dropx_(makeLiteralExpression)];
const json_arg = [return_x, dropx_(makeJSONExpression)];
const new_arg = [
  partial_x_(lookupSplitScope, NEW_SPLIT),
  partial_x_(makeSplitScopeReadExpression, NEW_SPLIT),
];
const var_arg = [
  partial_x_(lookupSplitScope, VAR_SPLIT),
  partial_x_(makeSplitScopeReadExpression, VAR_SPLIT),
];
const lab_arg = [
  partial_x_(lookupSplitScope, LAB_SPLIT),
  partial_x_(makeSplitScopeReadExpression, LAB_SPLIT),
];
const var_array_arg = [
  partial_x_(lookupAllScope, VAR_SPLIT),
  partial_x_(makeSplitScopeReadArrayExpression, VAR_SPLIT),
];
const lab_array_arg = [
  partial_x_(lookupAllScope, LAB_SPLIT),
  partial_x_(makeSplitScopeReadArrayExpression, LAB_SPLIT),
];

//////////////////////
// Synonym Argument //
//////////////////////

const kind_arg = primitive_arg;
const asynchronous_arg = primitive_arg;
const generator_arg = primitive_arg;
const serial_arg = primitive_arg;
const name_arg = primitive_arg;
const global_variable_arg = primitive_arg;
const specifier_arg = primitive_arg;
const source_arg = primitive_arg;
const delegate_arg = primitive_arg;

const link_array_arg = json_arg;

const label_arg = lab_arg;
const variable_arg = var_arg;
const callee_arg = new_arg;

const label_array_arg = lab_array_arg;
const variable_array_arg = var_array_arg;

/////////////
// Library //
/////////////

const traps = {
  // Informer //
  arrival: [
    constant____(null),
    kind_arg,
    link_array_arg,
    callee_arg,
    serial_arg,
  ],
  enter: [
    constant____(null),
    kind_arg,
    label_array_arg,
    variable_array_arg,
    serial_arg,
  ],
  completion: [constant_(null), serial_arg],
  leave: [constant_(null), serial_arg],
  debugger: [constant_(null), serial_arg],
  break: [constant__(null), label_arg, serial_arg],
  // Producer //
  parameters: [returnx_, expression_arg, serial_arg],
  intrinsic: [return_x_, name_arg, expression_arg, serial_arg],
  literal: [makeLiteralExpression, literal_arg, serial_arg],
  import: [return__x_, source_arg, specifier_arg, expression_arg, serial_arg],
  closure: [
    return___x_,
    kind_arg,
    asynchronous_arg,
    generator_arg,
    expression_arg,
    serial_arg,
  ],
  read: [return_x_, variable_arg, expression_arg, serial_arg],
  failure: [returnx_, expression_arg, serial_arg],
  // Consumer //
  eval: [returnx_, expression_arg, serial_arg],
  await: [returnx_, expression_arg, serial_arg],
  yield: [return_x_, delegate_arg, expression_arg, serial_arg],
  drop: [returnx_, expression_arg, serial_arg],
  export: [return_x_, specifier_arg, expression_arg, serial_arg],
  write: [return_x_, variable_arg, expression_arg, serial_arg],
  test: [returnx_, expression_arg, serial_arg],
  declare: [
    return__x_,
    kind_arg,
    global_variable_arg,
    expression_arg,
    serial_arg,
  ],
  return: [returnx_, expression_arg, serial_arg],
  // Combiner //
  apply: [
    makeApplyExpression,
    expression_arg,
    expression_arg,
    expression_array_arg,
    serial_arg,
  ],
  construct: [
    makeConstructExpression,
    expression_arg,
    expression_array_arg,
    serial_arg,
  ],
};

////////////
// Export //
////////////

const argumentize = (scope, trap, timing, value, index) => {
  const closure = trap[index + 1][timing];
  return closure(scope, value);
};

const makeTrapMaybeNode = (scope, {namespace, pointcut}, name, values) => {
  assert(hasOwnProperty(traps, name), "missing trap");
  const trap = traps[name];
  assert(trap.length - 1 === values.length, "trap arity mismatch");
  if (
    cut(pointcut, name, map(values, partialxxx__(argumentize, scope, trap, 0)))
  ) {
    return makeApplyExpression(
      makeGetExpression(
        makeSplitScopeReadExpression(scope, NEW_SPLIT, namespace),
        makeLiteralExpression(name),
      ),
      makeSplitScopeReadExpression(scope, NEW_SPLIT, namespace),
      map(values, partialxxx__(argumentize, scope, trap, 1)),
    );
  } else {
    return apply(trap[0], undefined, values);
  }
};

export const makeTrapExpression = (scope, traping, name, ...values) => {
  const maybe = makeTrapMaybeNode(scope, traping, name, values);
  assert(maybe !== null, "unexpected informer trap");
  return maybe;
};

export const makeTrapStatementArray = (scope, traping, name, ...values) => {
  const maybe = makeTrapMaybeNode(scope, traping, name, values);
  return maybe === null
    ? []
    : [makeEffectStatement(makeExpressionEffect(maybe))];
};
