import {concat} from "array-lite";

import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
  makeEffectStatement,
  makeBlock,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {
  makeBinding,
  makeGhostBinding,
  assertInitialization,
  matches,
  makeInitializeEffect,
  access,
  makeLookupExpression,
  makeLookupEffect,
  harvestVariables,
  harvestStatements,
} from "./binding.mjs";

const {undefined} = globalThis;

const callbacks = {
  onGhostHit: generateAssertUnreachable("onGhostHit"),
  onDeadHit: generateAssertUnreachable("onDeadHit"),
  onLiveHit: generateAssertUnreachable("onLiveHit"),
};

const test = (code, binding, statements) => {
  assertEqual(
    allignBlock(
      makeBlock(
        [],
        harvestVariables(binding),
        concat(harvestStatements(binding), statements),
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
  assertInitialization(makeGhostBinding("variable", "note")),
  undefined,
);

/////////////
// matches //
/////////////

assertEqual(matches(makeBinding("variable", "note"), "variable"), true);

assertEqual(matches(makeBinding("variable2", "note"), "variable1"), false);

/////////////////
// No deadzone //
/////////////////

{
  const binding = makeBinding("variable", "note");
  test(
    `
      {
        let x;
        effect('dead');
        x = 'init';
        effect(x);
        x = 'right';
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupExpression(binding, false, null, {
            ...callbacks,
            onDeadHit: (note) => {
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
          makeLookupExpression(binding, false, null, {
            ...callbacks,
            onLiveHit: (node, note) => {
              assertEqual(note, "note");
              return node;
            },
          }),
        ),
      ),
      makeEffectStatement(
        makeLookupEffect(binding, false, makeLiteralExpression("right"), {
          ...callbacks,
          onLiveHit: (node, note) => {
            assertEqual(note, "note");
            return node;
          },
        }),
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
        _x ? $x = 'right' : effect('dead');
        ($x = 'init', _x = true);
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupExpression(binding, true, null, {
            ...callbacks,
            onLiveHit: (node, note) => {
              assertEqual(note, "note");
              return node;
            },
            onDeadHit: (note) => {
              assertEqual(note, "note");
              return makeLiteralExpression("dead");
            },
          }),
        ),
      ),
      makeEffectStatement(
        makeLookupEffect(binding, true, makeLiteralExpression("right"), {
          ...callbacks,
          onLiveHit: (node, note) => {
            assertEqual(note, "note");
            return node;
          },
          onDeadHit: (note) => {
            assertEqual(note, "note");
            return makeExpressionEffect(makeLiteralExpression("dead"));
          },
        }),
      ),
      makeEffectStatement(
        makeInitializeEffect(binding, false, makeLiteralExpression("init")),
      ),
    ],
  );
}

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
      }
    `,
    binding,
    [
      makeEffectStatement(
        makeInitializeEffect(binding, true, makeLiteralExpression("init")),
      ),
      makeEffectStatement(
        makeExpressionEffect(
          makeLookupExpression(binding, false, null, {
            ...callbacks,
            onLiveHit: (node, note) => {
              assertEqual(note, "note");
              return node;
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

///////////
// Ghost //
///////////

{
  const binding = makeGhostBinding("variable", "note");
  test("{ effect('ghost'); }", binding, [
    makeEffectStatement(
      makeExpressionEffect(
        makeLookupExpression(binding, false, null, {
          ...callbacks,
          onDeadHit: (note) => {
            assertEqual(note, "note");
            return makeLiteralExpression("ghost");
          },
        }),
      ),
    ),
  ]);
}
