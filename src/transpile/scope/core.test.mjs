import {concat} from "array-lite";
import {assertEqual, generateAssertUnreachable} from "../../__fixture__.mjs";
import {makeCurry} from "../../util.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
  makeBlockStatement,
  makeBlock,
  makeSequenceExpression,
} from "../../ast/index.mjs";
import {allignBlock} from "../../allign/index.mjs";

import {
  makePropertyScope,
  makeRootScope,
  makeClosureScope,
  makeDynamicScope,
  makeScopeBlock,
  lookupScopeProperty,
  makeDeclareStatementArray,
  makeScopeInitializeEffect,
  makeScopeReadExpression,
  makeScopeWriteEffect,
  makeGhostDeclareStatementArray,
  makeScopeEvalExpression,
} from "./core.mjs";

const callbacks = {
  onMiss: makeCurry(generateAssertUnreachable("onMiss")),
  onGhostHit: makeCurry(generateAssertUnreachable("onGhostHit")),
  onStaticLiveHit: makeCurry(generateAssertUnreachable("onStaticLiveHit")),
  onStaticDeadHit: makeCurry(generateAssertUnreachable("onStaticDeadHit")),
  onDynamicFrame: makeCurry(generateAssertUnreachable("onDynamicFrame")),
};

//////////////
// Property //
//////////////

{
  let scope1 = makeRootScope();
  scope1 = makePropertyScope(scope1, "key1", "value1");
  scope1 = makePropertyScope(scope1, "key2", "value2");
  scope1 = makeClosureScope(scope1);
  scope1 = makeDynamicScope(scope1);
  assertEqual(
    allignBlock(
      makeScopeBlock(
        scope1,
        [],
        makeCurry((scope2) => {
          assertEqual(lookupScopeProperty(scope2, "key1"), "value1");
          return [];
        }),
      ),
      "{}",
    ),
    null,
  );
}

/////////////////////
// Static Deadzone //
/////////////////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) => {
        scope = makePropertyScope(scope, "key", "value");
        return concat(
          makeDeclareStatementArray(scope, "variable", "note", callbacks),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(scope, "variable", {
                  ...callbacks,
                  onStaticDeadHit: makeCurry((note) => {
                    assertEqual(note, "note");
                    return makeLiteralExpression(123);
                  }),
                }),
              ),
            ),
            makeEffectStatement(
              makeScopeInitializeEffect(
                scope,
                "variable",
                makeLiteralExpression(456),
                callbacks,
              ),
            ),
            makeEffectStatement(
              makeScopeWriteEffect(
                scope,
                "variable",
                makeLiteralExpression(789),
                {
                  ...callbacks,
                  onStaticLiveHit: makeCurry((note, effect) => {
                    assertEqual(note, "note");
                    return effect;
                  }),
                },
              ),
            ),
          ],
        );
      }),
    ),
    `
      {
        let x;
        effect(123);
        x = 456;
        x = 789;
      }
    `,
  ),
  null,
);

//////////////////////
// Dynamic Deadzone //
//////////////////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) =>
        concat(
          makeDeclareStatementArray(scope, "variable", "note", callbacks),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(makeClosureScope(scope), "variable", {
                  ...callbacks,
                  onStaticLiveHit: makeCurry((note, expression) => {
                    assertEqual(note, "note");
                    return expression;
                  }),
                  onStaticDeadHit: makeCurry((note) => {
                    assertEqual(note, "note");
                    return makeLiteralExpression("dead-read");
                  }),
                }),
              ),
            ),
            makeEffectStatement(
              makeScopeWriteEffect(
                makeClosureScope(scope),
                "variable",
                makeLiteralExpression("write"),
                {
                  ...callbacks,
                  onStaticLiveHit: makeCurry((note, effect) => {
                    assertEqual(note, "note");
                    return effect;
                  }),
                  onStaticDeadHit: makeCurry((note) => {
                    assertEqual(note, "note");
                    return makeExpressionEffect(
                      makeLiteralExpression("dead-write"),
                    );
                  }),
                },
              ),
            ),
            makeEffectStatement(
              makeScopeInitializeEffect(
                scope,
                "variable",
                makeLiteralExpression("init"),
                callbacks,
              ),
            ),
          ],
        ),
      ),
    ),
    `
      {
        let x, _x;
        _x = false;
        effect(_x ? x : 'dead-read');
        (_x ? x = 'write' : effect('dead-write'));
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
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope1) =>
        concat(
          makeDeclareStatementArray(scope1, "variable", "note", callbacks),
          [
            makeBlockStatement(
              makeScopeBlock(
                scope1,
                [],
                makeCurry((scope2) => [
                  makeEffectStatement(
                    makeScopeInitializeEffect(
                      scope2,
                      "variable",
                      makeLiteralExpression("init"),
                      callbacks,
                    ),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    ),
    `
      {
        let x, _x;
        _x = false;
        {
          (x = 'init', _x = true);
        }
      }
    `,
  ),
  null,
);

//////////
// Miss //
//////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) => [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeReadExpression(scope, "variable", {
              ...callbacks,
              onMiss: makeCurry(() => makeLiteralExpression("miss")),
            }),
          ),
        ),
      ]),
    ),
    `{ effect('miss'); }`,
  ),
  null,
);

////////////////////
// Ghost Variable //
////////////////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeRootScope(),
      [],
      makeCurry((scope) =>
        concat(
          makeGhostDeclareStatementArray(scope, "variable", "note", callbacks),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(scope, "variable", {
                  ...callbacks,
                  onStaticGhostHit: makeCurry((note, right) => {
                    assertEqual(note, "note");
                    assertEqual(right, null);
                    return makeLiteralExpression("read");
                  }),
                }),
              ),
            ),
          ],
        ),
      ),
    ),
    `
      {
        effect('read');
      }
    `,
  ),
  null,
);

///////////////////
// Dynamic Frame //
///////////////////

assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeDeclareStatementArray(
        makeDynamicScope(makeRootScope(), "frame"),
        "variable",
        "note",
        {
          onDynamicFrame: makeCurry((frame) => {
            assertEqual(frame, "frame");
            return [
              makeEffectStatement(
                makeExpressionEffect(makeLiteralExpression("dynamic")),
              ),
            ];
          }),
        },
      ),
    ),
    "{ effect('dynamic'); }",
  ),
  null,
);

assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeScopeInitializeEffect(
            makeDynamicScope(makeRootScope(), "frame"),
            "variable",
            makeLiteralExpression("init"),
            {
              onDynamicFrame: makeCurry((frame) => {
                assertEqual(frame, "frame");
                return makeExpressionEffect(makeLiteralExpression("dynamic"));
              }),
            },
          ),
        ),
      ],
    ),
    "{ effect('dynamic'); }",
  ),
  null,
);

assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      [
        makeEffectStatement(
          makeExpressionEffect(
            makeScopeReadExpression(
              makeDynamicScope(makeRootScope(), "frame"),
              "variable",
              {
                ...callbacks,
                onMiss: makeCurry(() => makeLiteralExpression("miss")),
                onDynamicFrame: makeCurry((frame, expression) => {
                  assertEqual(frame, "frame");
                  return makeSequenceExpression(
                    makeExpressionEffect(makeLiteralExpression("dynamic")),
                    expression,
                  );
                }),
              },
            ),
          ),
        ),
      ],
    ),
    "{ effect((effect('dynamic'), 'miss')); }",
  ),
  null,
);

//////////
// Eval //
//////////

assertEqual(
  allignBlock(
    makeScopeBlock(
      makeDynamicScope(
        makePropertyScope(makeRootScope(), "key", "value"),
        "frame",
      ),
      [],
      makeCurry((scope) =>
        concat(
          makeDeclareStatementArray(scope, "variable", "note", callbacks),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeEvalExpression(
                  makeClosureScope(scope),
                  makeLiteralExpression("eval"),
                ),
              ),
            ),
            makeEffectStatement(
              makeScopeInitializeEffect(
                scope,
                "variable",
                makeLiteralExpression("init"),
                callbacks,
              ),
            ),
          ],
        ),
      ),
    ),
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
