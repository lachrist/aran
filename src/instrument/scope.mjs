import {map, reduce, concat, filter} from "array-lite";
import {makeCounter, incrementCounter} from "../util.mjs";
import {
  makePrimitiveExpression,
  makeEffectStatement,
  makeObjectExpression,
  makeReadExpression,
  makeWriteEffect,
  makeBlock,
  makeTryStatement,
  makeReadEnclaveExpression,
  makeWriteEnclaveEffect,
  makeDeclareEnclaveStatement,
  makeScriptProgram,
} from "../ast/index.mjs";
import {unmangleLabel, unmangleVariable} from "./unmangle.mjs";
import {
  makeVarVariable,
  makeLabVariable,
  makeOldVariable,
  makeNewVariable,
  isVarVariable,
  isLabVariable,
} from "./variable.mjs";

const {
  undefined,
  Array: {isArray},
  Object: {entries: toEntries},
  String,
  Reflect: {defineProperty, getOwnPropertyDescriptor, getPrototypeOf},
} = globalThis;

const COUNTER = "@counter";
const SCRIPT = "@script";

const makeBinding = (data) => ({
  data,
  used: false,
});

const isEntryUsed = (entry) => entry[1].used;
const getEntryKey = (entry) => entry[0];

///////////////////
// makeRootScope //
///////////////////

export const makeRootScope = () => ({
  __proto__: null,
  [COUNTER]: makeCounter(0),
});

const makeScriptRootScope = (prefix, counter) => ({
  __proto__: null,
  [SCRIPT]: {prefix, counter},
  [COUNTER]: makeCounter(0),
});

const isScriptScope = (scope) =>
  getOwnPropertyDescriptor(getPrototypeOf(scope), SCRIPT) !== undefined;

//////////////////////////
// makeScopeNewVariable //
//////////////////////////

export const registerNewVariable = (scope) => {
  const body = isScriptScope(scope)
    ? `${String(scope[SCRIPT].prefix)}${String(
        incrementCounter(scope[SCRIPT].counter),
      )}`
    : String(incrementCounter(scope[COUNTER]));
  defineProperty(scope, makeNewVariable(body), {
    __proto__: null,
    writable: true,
    enumerable: true,
    configurable: true,
    value: makeBinding(null),
  });
  return body;
};

////////////////////////
// makeReadExpression //
////////////////////////

const generateMakeReadExpression = (makeVariable) => (scope, body) => {
  const variable = makeVariable(body);
  scope[variable].used = true;
  return isScriptScope(scope)
    ? makeReadEnclaveExpression(variable)
    : makeReadExpression(variable);
};
export const makeVarReadExpression =
  generateMakeReadExpression(makeVarVariable);
export const makeLabReadExpression =
  generateMakeReadExpression(makeLabVariable);
export const makeOldReadExpression =
  generateMakeReadExpression(makeOldVariable);
export const makeNewReadExpression =
  generateMakeReadExpression(makeNewVariable);

/////////////////////////
// makeWriteExpression //
/////////////////////////

const generateMakeWriteEffect = (makeVariable) => (scope, body, expression) => {
  const variable = makeVariable(body);
  scope[variable].used = true;
  return isScriptScope(scope)
    ? makeWriteEnclaveEffect(variable, expression)
    : makeWriteEffect(variable, expression);
};
export const makeNewWriteEffect = generateMakeWriteEffect(makeNewVariable);
export const makeOldWriteEffect = generateMakeWriteEffect(makeOldVariable);

///////////////////////
// makeScriptProgram //
///////////////////////

const makeScriptDeclareStatement = (entry) =>
  makeDeclareEnclaveStatement(
    "let",
    entry[0],
    makePrimitiveExpression({undefined: null}),
  );

export const makeScopeScriptProgram = (prefix, counter, callback) => {
  const scope = {
    __proto__: makeScriptRootScope(prefix, counter),
  };
  const statements = callback(scope);
  return makeScriptProgram(
    concat(
      map(filter(toEntries(scope), isEntryUsed), makeScriptDeclareStatement),
      statements,
    ),
  );
};

///////////////
// makeBlock //
///////////////

const generateAccumulate = (makeVariable, unmangle) => (frame, body) => {
  frame[makeVariable(body)] = makeBinding(unmangle(body));
  return frame;
};
const accumulateLab = generateAccumulate(makeLabVariable, unmangleLabel);
const accumulateVar = generateAccumulate(makeVarVariable, unmangleVariable);
const accumulateOld = generateAccumulate(makeOldVariable, () => null);

const isEntryInitializable = (entry) =>
  isVarVariable(entry[0]) || isLabVariable(entry[0]);

const makePrimitiveProperty = (entry) => [
  makePrimitiveExpression(entry[0]),
  makePrimitiveExpression(entry[1]),
];
const makeInitializeStatement = (entry) =>
  makeEffectStatement(
    makeWriteEffect(
      entry[0],
      makeObjectExpression(
        makePrimitiveExpression(null),
        map(toEntries(entry[1].data), makePrimitiveProperty),
      ),
    ),
  );

export const makeScopeBlock = (scope, labels, variables, callback) => {
  const extended_scope = reduce(
    variables,
    accumulateVar,
    reduce(
      labels,
      accumulateLab,
      reduce(variables, accumulateOld, {
        __proto__: scope,
      }),
    ),
  );
  const body = callback(extended_scope);
  const entries = filter(toEntries(extended_scope), isEntryUsed);
  return makeBlock(
    labels,
    map(entries, getEntryKey),
    concat(
      map(filter(entries, isEntryInitializable), makeInitializeStatement),
      isArray(body)
        ? body
        : [
            body.head,
            makeTryStatement(
              makeBlock([], [], body.try),
              makeBlock([], [], body.catch),
              makeBlock([], [], body.finally),
            ),
            body.tail,
          ],
    ),
  );
};
