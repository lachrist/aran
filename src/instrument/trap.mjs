import {map, zip, unzip, concat, flat} from "array-lite";

import {
  generateThrowError,
  generateReturn,
  returnFirst,
  returnSecond,
  returnThird,
  returnFourth,
} from "../util.mjs";

import {
  fromLiteral,
  makeLiteralExpression,
  makeApplyExpression,
  makeIntrinsicExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeEffectStatement,
  makeInvokeExpression,
} from "../ast/index.mjs";

import {lookupScopeVariable, makeScopeReadExpression} from "./scope.mjs";

import {cut} from "./cut.mjs";

const {
  undefined,
  Reflect: {apply},
  Object: {entries: toEntries},
} = globalThis;

const STATEMENT_BYPASS = "statement";
const EFFECT_BYPASS = "effect";
const EXPRESSION_BYPASS = "expression";

////////////
// Helper //
////////////

const call = (x) => (f) => f(x);

const callTrue = call(true);
const returnNull = generateReturn(null);
const returnEmptyArray = generateReturn([]);
const mapReturnNull = (array) => map(array, returnNull);

const getScopeData = (pair) => lookupScopeVariable(pair[0], pair[1]);
const getScopeDataArray = (pairs) => map(pairs, getScopeData);
const getScopeNullableData = (pair) =>
  pair === null ? null : getScopeData(pair);

const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makeLiteralExpression({undefined: null}),
    expressions,
  );

const makeScopeExpression = (pair) => makeScopeReadExpression(pair[0], pair[1]);
const makeScopeArrayExpression = (pairs) =>
  makeArrayExpression(map(pairs, makeScopeExpression));
const makeScopeNullableExpression = (pair) =>
  pair === null ? makeLiteralExpression(null) : makeScopeExpression(pair);

const makeLiteralObjectExpression = (object) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeLiteralExpression({undefined: null}),
    concat(
      [makeLiteralExpression(null)],
      map(flat(toEntries(object)), makeLiteralExpression),
    ),
  );

const makeLiteralObjectArrayExpression = (objects) =>
  makeArrayExpression(map(objects, makeLiteralObjectExpression));

const makeNullableLiteralObjectArrayExpression = (objects) =>
  objects === null
    ? makeLiteralExpression(null)
    : makeLiteralObjectArrayExpression(objects);

///////////////////
// Type Argument //
///////////////////

const expression_arg = [returnNull, returnFirst];
const expression_array_arg = [mapReturnNull, makeArrayExpression];
const primitive_arg = [returnFirst, makeLiteralExpression];
const literal_arg = [fromLiteral, makeLiteralExpression];
const scope_arg = [getScopeData, makeScopeExpression];
const scope_array_arg = [getScopeDataArray, makeScopeArrayExpression];
const link_array_arg = [returnFirst, makeNullableLiteralObjectArrayExpression];
const nullable_scope_arg = [getScopeNullableData, makeScopeNullableExpression];
const visit_arg = [returnNull, callTrue];

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

const label_arg = scope_arg;
const variable_arg = scope_arg;

const callee_arg = nullable_scope_arg;

const label_array_arg = scope_array_arg;
const variable_array_arg = scope_array_arg;

//////////////
// makeTrap //
//////////////

const missing_bypasses = {
  [STATEMENT_BYPASS]: generateThrowError("missing statement bypass"),
  [EFFECT_BYPASS]: generateThrowError("missing effect bypass"),
  [EXPRESSION_BYPASS]: generateThrowError("missing expression bypass"),
};

const generateMakeTrap =
  (bypass_type) =>
  (bypass, ...args) => {
    const [closures1, closures2] = unzip(args);
    return {
      ...missing_bypasses,
      [bypass_type]: bypass,
      static: closures1,
      dynamic: closures2,
    };
  };
const makeStatementTrap = generateMakeTrap(STATEMENT_BYPASS);
const makeExpressionTrap = generateMakeTrap(EXPRESSION_BYPASS);

/////////////
// Library //
/////////////

const traps = {
  __proto__: null,
  //////////////
  // Informer //
  //////////////
  arrival: makeStatementTrap(
    returnEmptyArray,
    kind_arg,
    link_array_arg,
    callee_arg,
    serial_arg,
  ),
  enter: makeStatementTrap(
    returnEmptyArray,
    kind_arg,
    label_array_arg,
    variable_array_arg,
    serial_arg,
  ),
  completion: makeStatementTrap(returnEmptyArray, serial_arg),
  leave: makeStatementTrap(returnEmptyArray, serial_arg),
  debugger: makeStatementTrap(returnEmptyArray, serial_arg),
  break: makeStatementTrap(returnEmptyArray, label_arg, serial_arg),
  //////////////
  // Producer //
  //////////////
  parameters: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  intrinsic: makeExpressionTrap(
    returnSecond,
    name_arg,
    expression_arg,
    serial_arg,
  ),
  literal: makeExpressionTrap(makeLiteralExpression, literal_arg, serial_arg),
  import: makeExpressionTrap(
    returnThird,
    source_arg,
    specifier_arg,
    expression_arg,
  ),
  closure: makeExpressionTrap(
    returnFourth,
    kind_arg,
    asynchronous_arg,
    generator_arg,
    expression_arg,
    serial_arg,
  ),
  read: makeExpressionTrap(
    returnSecond,
    variable_arg,
    expression_arg,
    serial_arg,
  ),
  failure: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  //////////////
  // Consumer //
  //////////////
  eval: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  await: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  yield: makeExpressionTrap(
    returnSecond,
    delegate_arg,
    expression_arg,
    serial_arg,
  ),
  drop: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  export: makeExpressionTrap(
    returnSecond,
    specifier_arg,
    expression_arg,
    serial_arg,
  ),
  write: makeExpressionTrap(
    returnSecond,
    variable_arg,
    expression_arg,
    serial_arg,
  ),
  test: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  declare: makeExpressionTrap(
    returnThird,
    kind_arg,
    global_variable_arg,
    expression_arg,
    serial_arg,
  ),
  return: makeExpressionTrap(returnFirst, expression_arg, serial_arg),
  //////////////
  // Combiner //
  //////////////
  apply: makeExpressionTrap(
    makeApplyExpression,
    expression_arg,
    expression_arg,
    expression_array_arg,
    serial_arg,
  ),
  construct: makeExpressionTrap(
    makeConstructExpression,
    expression_arg,
    expression_array_arg,
    serial_arg,
  ),
  invoke: makeExpressionTrap(
    (visitObject, visitKey, expressions) =>
      makeInvokeExpression(visitObject(false), visitKey(false), expressions),
    visit_arg,
    visit_arg,
    expression_array_arg,
    serial_arg,
  ),
};

////////////
// Export //
////////////

const applyPair = ({0: first, 1: second}) => first(second);

const generateMakeTrapNode =
  (bypass_type, makeNode) =>
  ({namespace, pointcut}, name, ...values) =>
    cut(
      pointcut,
      name === "invoke" ? "apply" : name,
      map(zip(traps[name].static, values), applyPair),
    )
      ? makeNode(
          makeInvokeExpression(
            makeApplyExpression(
              makeIntrinsicExpression("aran.readGlobal"),
              makeLiteralExpression({undefined: null}),
              [makeLiteralExpression(namespace)],
            ),
            makeLiteralExpression(name === "invoke" ? "apply" : name),
            map(zip(traps[name].dynamic, values), applyPair),
          ),
        )
      : apply(traps[name][bypass_type], undefined, values);

export const makeTrapStatementArray = generateMakeTrapNode(
  STATEMENT_BYPASS,
  (expression) => [makeEffectStatement(makeExpressionEffect(expression))],
);

export const makeTrapExpression = generateMakeTrapNode(
  EXPRESSION_BYPASS,
  returnFirst,
);

export const makeTrapEffect = generateMakeTrapNode(
  EFFECT_BYPASS,
  makeExpressionEffect,
);
