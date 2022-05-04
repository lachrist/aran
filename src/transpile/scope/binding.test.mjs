import {concat} from "array-lite";

import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";

import {
  makeSequenceExpression,
  makeExpressionEffect,
  makeLiteralExpression,
  makeEffectStatement,
  makeBlock,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  makeBinding,
  makeGhostBinding,
  assertBindingInitialization,
  equalsBindingVariable,
  makeBindingInitializeEffect,
  accessBinding,
  makeBindingLookupExpression,
  harvestBindingVariables,
  harvestBindingStatements,
} from "./binding.mjs";

const {undefined} = globalThis;

const curries = {
  onGhostHit: generateAssertUnreachable("onGhostHit"),
  onDeadHit: generateAssertUnreachable("onDeadHit"),
  onLiveHit: generateAssertUnreachable("onLiveHit"),
};

const test = (code, binding, statements) => {
  assertEqual(
    allignBlock(
      makeBlock(
        [],
        harvestBindingVariables(binding),
        concat(harvestBindingStatements(binding), statements),
      ),
      code,
    ),
    null,
  );
};

////////////////////
// Initialization //
////////////////////

assertEqual(
  assertBindingInitialization(makeGhostBinding("variable", "note")),
  undefined,
);

///////////////////////////
// equalsBindingVariable //
///////////////////////////

assertEqual(
  equalsBindingVariable(makeBinding("variable", "note"), "variable"),
  true,
);

assertEqual(
  equalsBindingVariable(makeBinding("variable2", "note"), "variable1"),
  false,
);

/////////////////
// No deadzone //
/////////////////

{
  const binding = makeBinding("variable", "note");
  test(
    "{ let x; effect('dead'); x = 'init'; effect((x = 'right', x)); }",
    binding,
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeBindingLookupExpression(binding, false, {
            ...curries,
            onDeadHit: (note) => {
              assertEqual(note, "note");
              return makeLiteralExpression("dead");
            },
          }),
        ),
      ),
      makeEffectStatement(
        makeBindingInitializeEffect(
          binding,
          false,
          makeLiteralExpression("init"),
        ),
      ),
      makeEffectStatement(
        makeExpressionEffect(
          makeBindingLookupExpression(binding, false, {
            ...curries,
            onLiveHit: (read, write, note) => {
              assertEqual(note, "note");
              return makeSequenceExpression(
                write(makeLiteralExpression("right")),
                read(),
              );
            },
          }),
        ),
      ),
    ],
  );
}

//////////////
// Deadzone //
//////////////

{
  const binding = makeBinding("variable", "note");
  test(
    `
      {
        let $x, _x;
        _x = false;
        effect(_x ? $x : 'dead');
        ($x = 'init', _x = true);
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeBindingLookupExpression(binding, true, {
            ...curries,
            onLiveHit: (read, _write, note) => {
              assertEqual(note, "note");
              return read();
            },
            onDeadHit: (note) => {
              assertEqual(note, "note");
              return makeLiteralExpression("dead");
            },
          }),
        ),
      ),
      makeEffectStatement(
        makeBindingInitializeEffect(
          binding,
          false,
          makeLiteralExpression("init"),
        ),
      ),
    ],
  );
}

{
  const binding = makeBinding("variable", "note");
  accessBinding(true, binding);
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
        makeBindingInitializeEffect(
          binding,
          false,
          makeLiteralExpression("init"),
        ),
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
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeBindingInitializeEffect(
          binding,
          true,
          makeLiteralExpression("init"),
        ),
      ),
      makeEffectStatement(
        makeExpressionEffect(
          makeBindingLookupExpression(binding, false, {
            ...curries,
            onLiveHit: (read, _write, note) => {
              assertEqual(note, "note");
              return read();
            },
            onDeadHit: (note) => {
              assertEqual(note, "note");
              return makeLiteralExpression("dead");
            },
          }),
        ),
      ),
    ],
  );
}
//
// ///////////
// // Ghost //
// ///////////
//
// {
//   const binding = makeGhostBinding("variable", "note");
//   test("{ effect('ghost'); }", binding, [
//     makeEffectStatement(
//       makeExpressionEffect(
//         makeBindingLookupExpression(binding, false, {
//           ...curries,
//           onGhostHit: (note) => {
//             assertEqual(note, "note");
//             return makeLiteralExpression("ghost");
//           },
//         }),
//       ),
//     ),
//   ]);
// }
