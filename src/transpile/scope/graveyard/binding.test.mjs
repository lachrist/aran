import {concat} from "array-lite";

import {
  assertSuccess,
  assertEqual,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
  makeEffectStatement,
  makeBlock,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  READ,
  makeBinding,
  makeGhostBinding,
  assertInitialization,
  matches,
  makeInitializeEffect,
  access,
  makeLookupExpression,
  makeLookupEffect,
  makeLookupStatementArray,
  harvestVariables,
  harvestStatements,
} from "./binding.mjs";

const {undefined} = globalThis;

const callbacks = {
  onGhostHit: generateAssertUnreachable("onGhostHit"),
  onStaticDeadHit: generateAssertUnreachable("onStaticDeadHit"),
  onStaticLiveHit: generateAssertUnreachable("onStaticLiveHit"),
};

const test = (code, binding, statements) => {
  assertSuccess(
    allignBlock(
      makeBlock(
        [],
        harvestVariables(binding),
        concat(harvestStatements(binding), statements),
      ),
      code,
    ),
  );
};

////////////////////
// Initialization //
////////////////////

assertEqual(
  assertInitialization(makeGhostBinding("variable", "note")),
  undefined,
);

/////////////
// matches //
/////////////

assertEqual(matches(makeBinding("variable", "note"), "variable"), true);

assertEqual(matches(makeBinding("variable2", "note"), "variable1"), false);

/////////////////////////
// No Dynamic Deadzone //
/////////////////////////

{
  const binding = makeBinding("variable", "note");
  test(
    `
      {
        let x;
        effect('dead');
        x = 'init';
        effect(x);
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupExpression(binding, false, READ, {
            ...callbacks,
            onStaticDeadHit: (note) => {
              assertEqual(note, "note");
              return makeLiteralExpression("dead");
            },
          }),
        ),
      ),
      makeEffectStatement(
        makeInitializeEffect(binding, false, makeLiteralExpression("init")),
      ),
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupExpression(binding, false, READ, {
            ...callbacks,
            onStaticLiveHit: (node, note) => {
              assertEqual(note, "note");
              return node;
            },
          }),
        ),
      ),
    ],
  );
}

////////////
// Access //
////////////

{
  const binding = makeBinding("variable", "note");
  access(binding, true);
  test(
    `
      {
        let $x, _x;
        _x = false;
        ($x = 'init', _x = true);
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeInitializeEffect(binding, false, makeLiteralExpression("init")),
      ),
    ],
  );
}

/////////////
// Distant //
/////////////

{
  const binding = makeBinding("variable", "note");
  test(
    `
      {
        let $x, _x;
        _x = false;
        ($x = 'init', _x = true);
        effect(_x ? $x : 'dead');
        _x
          ? $x = 'right'
          : effect('dead');
        if (_x) {
          effect($x);
        } else {
          effect('dead');
        }
      }
    `,
    binding,
    concat(
      [
        makeEffectStatement(
          makeInitializeEffect(binding, true, makeLiteralExpression("init")),
        ),
        makeEffectStatement(
          makeExpressionEffect(
            makeLookupExpression(binding, false, READ, {
              ...callbacks,
              onStaticLiveHit: (node, note) => {
                assertEqual(note, "note");
                return node;
              },
              onStaticDeadHit: (note) => {
                assertEqual(note, "note");
                return makeLiteralExpression("dead");
              },
            }),
          ),
        ),
        makeEffectStatement(
          makeLookupEffect(binding, false, makeLiteralExpression("right"), {
            ...callbacks,
            onStaticLiveHit: (node, note) => {
              assertEqual(note, "note");
              return node;
            },
            onStaticDeadHit: (note) => {
              assertEqual(note, "note");
              return makeExpressionEffect(makeLiteralExpression("dead"));
            },
          }),
        ),
      ],
      makeLookupStatementArray(binding, false, READ, {
        ...callbacks,
        onStaticLiveHit: (node, note) => {
          assertEqual(note, "note");
          return [makeEffectStatement(makeExpressionEffect(node))];
        },
        onStaticDeadHit: (note) => {
          assertEqual(note, "note");
          return [
            makeEffectStatement(
              makeExpressionEffect(makeLiteralExpression("dead")),
            ),
          ];
        },
      }),
    ),
  );
}

///////////
// Ghost //
///////////

{
  const binding = makeGhostBinding("variable", "note");
  test("{ effect('ghost'); }", binding, [
    makeEffectStatement(
      makeExpressionEffect(
        makeLookupExpression(binding, false, READ, {
          ...callbacks,
          onStaticDeadHit: (note) => {
            assertEqual(note, "note");
            return makeLiteralExpression("ghost");
          },
        }),
      ),
    ),
  ]);
}
