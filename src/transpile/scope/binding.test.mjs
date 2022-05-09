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
  assertBindingInitialization,
  equalsBindingVariable,
  makeBindingInitializeEffect,
  accessBinding,
  makeBindingLookupNode,
  harvestBindingVariables,
  harvestBindingStatements,
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
          makeBindingLookupNode(binding, false, null, {
            ...callbacks,
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
          makeBindingLookupNode(binding, false, null, {
            ...callbacks,
            onLiveHit: (node, note) => {
              assertEqual(note, "note");
              return node;
            },
          }),
        ),
      ),
      makeEffectStatement(
        makeBindingLookupNode(binding, false, makeLiteralExpression("right"), {
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
          makeBindingLookupNode(binding, true, null, {
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
        makeBindingLookupNode(binding, true, makeLiteralExpression("right"), {
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
  accessBinding(binding, true);
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
          makeBindingLookupNode(binding, false, null, {
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
        makeBindingLookupNode(binding, false, null, {
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
