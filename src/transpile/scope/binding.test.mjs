import {concat} from "array-lite";
import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";
import {makeCurry} from "../../util.mjs";
import {
  makeExpressionEffect,
  makeReadExpression,
  makeLiteralExpression,
  makeEffectStatement,
  makeWriteEffect,
  makeBlock,
} from "../../ast/index.mjs";
import {allignBlock} from "../../allign/index.mjs";
import {
  makeBinding,
  makeGhostBinding,
  equalsBindingVariable,
  includesBindingVariable,
  annotateBinding,
  makeBindingInitializeEffect,
  accessBinding,
  makeBindingLookupExpression,
  assertBindingInitialization,
  harvestBindingVariables,
  harvestBindingStatements,
} from "./binding.mjs";

const curries = {
  onGhostHit: makeCurry(generateAssertUnreachable("onGhostHit")),
  onDeadHit: makeCurry(generateAssertUnreachable("onDeadHit")),
  onLiveHit: makeCurry(generateAssertUnreachable("onLiveHit")),
};

const test = (code, binding, statements) => {
  assertBindingInitialization(binding);
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

///////////
// query //
///////////

assertEqual(equalsBindingVariable("variable", makeBinding("variable")), true);

assertEqual(
  equalsBindingVariable("variable1", makeBinding("variable2")),
  false,
);

assertEqual(
  includesBindingVariable(["variable"], makeBinding("variable")),
  true,
);

assertEqual(
  includesBindingVariable(["variable1"], makeBinding("variable2")),
  false,
);

/////////////////
// No deadzone //
/////////////////

{
  const binding = makeBinding("variable");
  annotateBinding(binding, "note");
  test("{ let x; effect('dead'); x = 'init'; effect(x); }", binding, [
    makeEffectStatement(
      makeExpressionEffect(
        makeBindingLookupExpression(binding, false, {
          ...curries,
          onDeadHit: makeCurry(() => makeLiteralExpression("dead")),
        }),
      ),
    ),
    makeEffectStatement(
      makeBindingInitializeEffect(binding, false, {
        onDeadHit: makeCurry((variable) =>
          makeWriteEffect(variable, makeLiteralExpression("init")),
        ),
      }),
    ),
    makeEffectStatement(
      makeExpressionEffect(
        makeBindingLookupExpression(binding, false, {
          ...curries,
          onLiveHit: makeCurry((variable, note) => {
            assertEqual(note, "note");
            return makeReadExpression(variable);
          }),
        }),
      ),
    ),
  ]);
}

//////////////
// Deadzone //
//////////////

{
  const binding = makeBinding("variable");
  annotateBinding(binding, "note");
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
            onLiveHit: makeCurry((variable, note) => {
              assertEqual(note, "note");
              return makeReadExpression(variable);
            }),
            onDeadHit: makeCurry(() => makeLiteralExpression("dead")),
          }),
        ),
      ),
      makeEffectStatement(
        makeBindingInitializeEffect(binding, false, {
          onDeadHit: makeCurry((variable) =>
            makeWriteEffect(variable, makeLiteralExpression("init")),
          ),
        }),
      ),
    ],
  );
}

{
  const binding = makeBinding("variable");
  annotateBinding(binding, "note");
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
        makeBindingInitializeEffect(binding, false, {
          onDeadHit: makeCurry((variable) =>
            makeWriteEffect(variable, makeLiteralExpression("init")),
          ),
        }),
      ),
    ],
  );
}

/////////////
// Distant //
/////////////

{
  const binding = makeBinding("variable");
  annotateBinding(binding, "note");
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
        makeBindingInitializeEffect(binding, true, {
          onDeadHit: makeCurry((variable) =>
            makeWriteEffect(variable, makeLiteralExpression("init")),
          ),
        }),
      ),
      makeEffectStatement(
        makeExpressionEffect(
          makeBindingLookupExpression(binding, false, {
            ...curries,
            onLiveHit: makeCurry((variable, note) => {
              assertEqual(note, "note");
              return makeReadExpression(variable);
            }),
            onDeadHit: makeCurry(() => makeLiteralExpression("dead")),
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
  const binding = makeGhostBinding("variable");
  annotateBinding(binding, "note");
  test("{ effect('ghost'); }", binding, [
    makeEffectStatement(
      makeExpressionEffect(
        makeBindingLookupExpression(binding, false, {
          ...curries,
          onGhostHit: makeCurry((note) => {
            assertEqual(note, "note");
            return makeLiteralExpression("ghost");
          }),
        }),
      ),
    ),
  ]);
}
