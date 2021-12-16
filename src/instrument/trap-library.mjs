import {
  generateThrowError,
  generateReturn,
  returnFirst,
  returnSecond,
} from "../util.mjs";

export const getTrapCombine = (name) => traps[name].combine;
export const getTrapStatic = (name) => traps[name].static;
export const getTrapDynamic = (name) => traps[name].dynamic;

const dropFirst =
  (f) =>
  (_x, ...xs) =>
    apply(f, undefined, xs);

const makeFirstArgumentExpression = () =>
  makeApplyExpression(
    makeIntrinsicExpression("Reflect.get"),
    makeLiteralExpression({undefined: null}),
    [makeInputExpression(), makeLiteralExpression(0)],
  );

const makeReturnArrowExpression = (expression) =>
  makeClosureExpression("arrow", false, false, [
    makeReturnStatement(expression),
  ]);

const returnNull = generateReturn(null);
const returnNullPair = generateReturn([null, null]);

const combineInformer = generateThrowError(
  "this trap is an informer and should never be combine",
);

const generateLookup =
  (lookup) =>
  ({scope, variable}) =>
    lookup(scope, variable);

const lookupNewStatic = ({scope, variable}) => lookupNewStatic(scope, variable);

export const makeScopeVariable = (scope, variable) => ({scope, variable});

export const liftScopeVariable =
  (closure) =>
  ({scope, variable}) =>
    closure(scope, variable);

export const bind =
  (f, g) =>
  (...xs) =>
    f(apply(g, undefined, xs));

const traps = {
  //////////////
  // Informer //
  //////////////
  "enter": {
    combine: combineInformer,
    static: [liftScopeVariable(lookupNew), identity],
    dynamic: [
      liftScopeVariable(makeScopeNewReadExpression),
      makePrimitiveExpression,
    ],
  },

  "debugger": {
    combine: combineInformer,
    static: [identity],
    dynammic: [makeLiteralExpression],
  },

  "break": {
    combine: combineInformer,
    static: [liftScopeVariable(lookupLab), identity],
    dynamic: [liftScopeVariable(makeLabReadExpression), makeLiteralExpression],
  },
  "literal": {
    combine: makeLiteralExpression,
    static: [fromLiteral, returnFirst],
    dynamic: [makeLiteralExpression, makeLiteralExpression],
  },
  "read": {
    combine: bind(liftScopeVariable(makeOldReadExpression), returnSecond),
    static: [liftScopeVariable(lookupVar), returnNull, returnFirst],
    dynamic: [
      liftScopeVariable(makeVarReadExpression),
      liftScopeVariable(makeOldReadExpression),
      makePrimitiveExpression,
    ],
  },
  "write": {
    combine: returnSecond,
    static: [liftScopeVariable(lookupVar), returnNull, identity],
    dynamic: [
      liftScopeVariable(makeVarReadExpression),
      identity,
      makeLiteralExpression,
    ],
  },
  //////////////
  // Combiner //
  //////////////
  "dynamic-import": {
    combine: dropFirst(makeDynamicImportExpression),
    static: [returnNull, returnNull, identity],
    dynamic: [
      () =>
        makeReturnArrowExpression(
          makeDynamicImportExpression(makeFirstArgumentExpression()),
        ),
      identity,
      makeLiteralExpression,
    ],
  },
  "write-free": {
    combine: dropFirst(makeWriteEnclaveEffect),
    static: [returnNull, identity, returnNull, identity],
    dynamic: [
      (variable) =>
        makeSimpleArrowExpression(
          makeSequenceExpression(
            makeWriteEffect(variable, makeFirstArgumentExpression()),
            makeLiteralExpression({undefined: null}),
          ),
        ),
      makeLiteralExpression,
      identity,
      makeLiteralExpression,
    ],
  },
  "read-free": {
    combine: dropFirst(makeReadEnclaveExpression),
    static: [returnNull, identity, identity],
    dynamic: [
      (variable) =>
        makeReturnArrowExpression(makeReadEnclaveExpression(variable)),
      makeLiteralExpression,
      makeLiteralExpression,
    ],
  },
  "typeof-free": {
    combine: dropFirst(makeTypeofEnclaveExpression),
    static: [returnNull, identity, identity],
    dynamic: [
      (variable) =>
        makeReturnArrowExpression(makeTypeofEnclaveExpression(variable)),
      makeLiteralExpression,
      makeLiteralExpression,
    ],
  },
  "get-free-super": {
    combine: dropFirst(makeGetSuperEnclaveExpression),
    static: [returnNull, returnNull, identity],
    dynamic: [
      () =>
        makeReturnArrowExpression(
          makeGetSuperEnclaveExpression(makeArgumentExpression(0)),
        ),
      identity,
      makeLiteralExpression,
    ],
  },
  "set-free-super": {
    combine: dropFirst(makeSetSuperEnclaveEffect),
    static: [returnNull, returnNull, returnNull, identity],
    dynamic: [
      () =>
        makeReturnArrowExpression(
          makeSequenceExpression(
            makeSetSuperEnclaveEffect(
              makeArgumentExpression(0),
              makeArgumentExpression(1),
            ),
            makeLiteralExpression({undefined: null}),
          ),
        ),
      identity,
      identity,
      makeLiteralExpression,
    ],
  },

  "binary": {
    combine: makeBinaryExpression,
    static: [identity, returnNull, returnNull, identity],
    dynamic: [makeLiteralExpression, identity, identity, makeLiteralExpression],
  },
  "object": {
    combine: makeObjectExpression,
    static: [returnNull, (properties) => map(properties, returnNullPair)],
    dynamic: [identity, identity],
  },
};
