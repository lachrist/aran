
import {reduce} from "array-lite";
import {makeReadExpression, makeWriteExpression, makeBlock, makeTryStatement} from "./ast/index.mjs";
import {unmangleLabel, unmangleVariable} from "./unmangle.mjs";
import {
  makeVarVariable,
  makeLabVariable,
  makeOldVariable,
  makeNewVariable,
  isVarVariable,
  isLabVariable,
  isNewVariable,
  isOldVariable,
} from "./variable.mjs";

const {String} = globalThis;

const COUNTER = "@counter";

const makeBinding = (data) => ({
  data,
  used: false,
});

const lookup = (scope, variable) => {
  while (scope !== null) {
    if (variable in scope.frame) {
      return scope.frame[variable];
    }
    scope = scope.parent;
  }
  throw new Error("missing variable binding");
};

///////////////////
// makeRootScope //
///////////////////

export const makeRootScope = () => ({__proto__: null, "@counter":0});

//////////////////////////
// makeScopeNewVariable //
//////////////////////////

export const makeScopeNewVariable = (scope) => {
  scope[COUNTER] += 1;
  const body = String(scope[COUNTER]);
  defineProperty(
    scope,
    makeNewVariable(body),
    {
      __proto__: null,
      writable: true,
      enumerable: true,
      configurable: true,
      value: makeBinding(null),
    },
  );
  return body;
};

////////////////////////
// makeReadExpression //
////////////////////////

const generateReadExpression = (makeVariable) => (scope, body) => {
  const variable = makeVariable(body);
  lookup(scope, variable).used = true;
  return makeReadExpression(variable);
};
export const makeVarReadExpression = generateReadExpression(makeVarVariable);
export const makeLabReadExpression = generateReadExpression(makeLabVariable);
export const makeOldReadExpression = generateReadExpression(makeOldVariable);
export const makeNewReadExpression = generateReadExpression(makeNewVariable);

/////////////////////////
// makeWriteExpression //
/////////////////////////

const generateWriteEffect = (makeVariable) => (scope, body, expression) => {
  const variable = makeVariable(body);
  lookup(scope, variable).used = true;
  return makeWriteEffect(variable, expression);
};
export const makeNewWriteEffect = generateWriteEffect(makeNewVariable);
export const makeOldWriteEffect = generateWriteEffect(makeOldVariable);

///////////////
// makeBlock //
///////////////

const generateAccumulate = (makeVariable, unmangle) => (frame, body) => {
  frame[makeVariable(body)] = unmangle(body);
  return frame;
};
const accumulateLab = generateAccumulate(makeLabVariable, unmangleLabel);
const accumulateVar = generateAccumulate(makeVarVariable, unmangleVariable);
const accumulateOld = generateAccumulate(makeOldVariable, () => null);

const isEntryUsed = (entry) => entry[1].used;
const getEntryKey = (entry) => entry[0];

const isEntryInitializable = (entry) => isVarVariable(entry[0]) || isLabVariable(entry[0]);

const makePrimitiveProperty = (entry) => [
  makePrimitiveExpression(entry[0]),
  makePrimitiveExpression(entry[1]),
];
const makeInitializeStatement = (entry) => makeEffectStatement(
  makeWriteEffect(
    entry[0],
    makeObjectExpression(
      makePrimitiveExpression(null),
      map(toEntries(entry[1]), makePrimitiveProperty),
    ),
  ),
);

const makeScopeBlock = (scope, labels, variables, callback) => {
  const extended_scope = reduce(
    variables,
    accumulateOld,
    reduce(
      labels,
      accumulateLab,
      reduce(
        variables,
        accumulateVar,
        {
          __proto__: scope,
        },
      ),
    ),
  );
  const body = callback(extended_scope);
  const entries = filter(toEntries(extended_scope.frame), isEntryUsed),
  return makeBlock(
    null,
    labels,
    map(entries, getEntryKey),
    concat(
      map(
        filter(entries, isEntryInitializable),
        makeInitializeStatement,
      ),
      isArray(body) ? body : [
        body.frame,
        makeTryStatement(
          makeBlock(null, [], [], body.try),
          makeBlock(null, [], [], body.catch),
          makeBlock(null, [], [], body.finally),
        ),
      ],
    ),
  );
};
