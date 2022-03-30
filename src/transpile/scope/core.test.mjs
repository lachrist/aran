import {
  assertThrow,
  assertEqual,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";

import {
  makeEffectStatement,
  makeLiteralExpression,
  makeBlockStatement,
  makeSequenceExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {
  allignBlock,
  allignExpression,
  allignEffect,
} from "../../allign/index.mjs";

import {
  makePropertyScope,
  makeRootScope,
  makeClosureScope,
  makeDynamicScope,
  makeScopeBlock,
  lookupScopeProperty,
  declareVariable,
  declareFreshVariable,
  makeInitializeEffect,
  makeLookupExpression,
  makeScopeEvalExpression,
} from "./core.mjs";

const KIND1 = 2;
const KIND2 = 3;
const KINDS = KIND1 * KIND2;

const curries = {
  onMiss: generateAssertUnreachable("onMiss"),
  onHit: generateAssertUnreachable("onHit"),
  onLiveHit: generateAssertUnreachable("onStaticLiveHit"),
  onDeadHit: generateAssertUnreachable("onStaticDeadHit"),
  onDynamicFrame: generateAssertUnreachable("onDynamicFrame"),
};

//////////////
// Property //
//////////////

assertThrow(() => lookupScopeProperty(makeRootScope(), "key"));

assertEqual(
  lookupScopeProperty(
    makeClosureScope(makePropertyScope(makeRootScope(), "key", "value")),
    "key",
  ),
  "value",
);

/////////////
// Regular //
/////////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), KINDS, [], (scope) => {
      scope = makePropertyScope(scope, "key", "value");
      assertEqual(
        declareFreshVariable(scope, KIND1, "variable", "note"),
        "variable_1_1",
      );
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(
              makeClosureScope(scope),
              KIND1,
              "variable_1_1",
              {
                ...curries,
                onLiveHit: (read, _write, note) => {
                  assertEqual(note, "note");
                  return read();
                },
                onDeadHit: () => makeLiteralExpression("dead"),
              },
            ),
          ),
        ),
        makeEffectStatement(
          makeInitializeEffect(scope, KIND1, "variable_1_1", {
            onHit: (write, note) => {
              assertEqual(note, "note");
              return write(makeLiteralExpression("init"));
            },
          }),
        ),
      ];
    }),
    `
      {
        let x, _x;
        _x = false;
        effect(_x ? x : 'dead');
        (x = 'init', _x = true);
      }
    `,
  ),
  null,
);

////////////////////////////
// Distant Initialization //
////////////////////////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), KINDS, [], (scope1) => {
      assertEqual(
        declareVariable(scope1, KIND1, "variable", "note"),
        "variable",
      );
      return [
        makeBlockStatement(
          makeScopeBlock(scope1, KIND2, [], (scope2) => [
            makeEffectStatement(
              makeInitializeEffect(scope2, KIND1, "variable", {
                ...curries,
                onHit: (write, note) => {
                  assertEqual(note, "note");
                  return write(makeLiteralExpression("init"));
                },
              }),
            ),
          ]),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(makeClosureScope(scope1), KIND1, "variable", {
              ...curries,
              onLiveHit: (read, _write, note) => {
                assertEqual(note, "note");
                return read();
              },
              onDeadHit: () => makeLiteralExpression("dead"),
            }),
          ),
        ),
      ];
    }),
    `
      {
        let x, _x;
        _x = false;
        {
          (x = 'init', _x = true);
        }
        effect(_x ? x : 'dead');
      }
    `,
  ),
  null,
);

//////////
// Miss //
//////////

assertThrow(() =>
  makeInitializeEffect(makeRootScope(), KIND1, "variable", curries),
);

assertThrow(() =>
  declareVariable(makeClosureScope(makeRootScope()), KIND1, "variable", "note"),
);

assertEqual(
  allignExpression(
    makeLookupExpression(makeRootScope(), KIND1, "variable", {
      ...curries,
      onMiss: () => makeLiteralExpression("miss"),
    }),
    "'miss'",
  ),
  null,
);

///////////////////
// Dynamic Frame //
///////////////////

assertEqual(
  declareVariable(
    makeDynamicScope(makeRootScope(), KINDS, "frame"),
    KIND1,
    "variable",
    null,
  ),
  "frame",
);

assertEqual(
  allignEffect(
    makeInitializeEffect(
      makeDynamicScope(makeRootScope(), KINDS, "frame"),
      KIND1,
      "variable",
      {
        ...curries,
        onDynamicFrame: (frame) =>
          makeExpressionEffect(makeLiteralExpression(frame)),
      },
    ),
    `effect('frame')`,
  ),
  null,
);

assertEqual(
  allignExpression(
    makeLookupExpression(
      makeDynamicScope(makeRootScope(), KINDS, "frame"),
      KIND1,
      "variable",
      {
        ...curries,
        onMiss: () => makeLiteralExpression("miss"),
        onDynamicFrame: (frame, expression) =>
          makeSequenceExpression(
            makeExpressionEffect(makeLiteralExpression(frame)),
            expression,
          ),
      },
    ),
    "(effect('frame'), 'miss')",
  ),
  null,
);

//////////
// Eval //
//////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), KINDS, [], (scope) => {
      assertEqual(
        declareVariable(scope, KIND1, "variable", "note"),
        "variable",
      );
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeEvalExpression(
              makeClosureScope(scope),
              makeLiteralExpression("eval"),
            ),
          ),
        ),
        makeEffectStatement(
          makeInitializeEffect(scope, KIND1, "variable", {
            ...curries,
            onHit: (write, note) => {
              assertEqual(note, "note");
              return write(makeLiteralExpression("init"));
            },
          }),
        ),
      ];
    }),
    `
      {
        let x, _x;
        _x = false;
        effect(eval([x, _x], 'eval'));
        (x = 'init', _x = true);
      }
    `,
  ),
  null,
);
