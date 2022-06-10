import {concat} from "array-lite";

import {assertSuccess} from "../../__fixture__.mjs";

import {makeLiteralExpression, makeEffectStatement} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {BASE, META} from "./variable.mjs";

import {makeRead} from "./right.mjs";

import {enclose} from "./structure.mjs";

import {createRoot} from "./property.mjs";

import {
  create as createFrame,
  BLOCK_STATIC,
  DEFINE_STATIC,
} from "./frame/index.mjs";

import {
  makeChainBlock,
  makeDeclareStatements,
  makeInitializeStatements,
  makeLookupEffect,
} from "./chain.mjs";

assertSuccess(
  allignBlock(
    makeChainBlock(
      createRoot(123),
      ["label"],
      [
        createFrame(BLOCK_STATIC, BASE, {}),
        createFrame(DEFINE_STATIC, META, {}),
      ],
      (scope) =>
        concat(
          makeDeclareStatements(scope, "const", BASE, "variable", null, []),
          [
            makeEffectStatement(
              makeLookupEffect(enclose(scope), BASE, "variable", makeRead()),
            ),
          ],
          makeInitializeStatements(
            scope,
            "const",
            BASE,
            "variable",
            makeLiteralExpression("right"),
          ),
        ),
    ),
    `
      label: {
        let variable, initialized;
        initialized = false;
        (
          initialized ?
          effect(variable) :
          effect(
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable' before initialization",
              ),
            ),
          )
        );
        variable = 'right';
        initialized = true;
      }
    `,
  ),
);

//
// const scope = extend(
//   extend(createRoot(123), DEFINE_STATIC, BASE, {}),
//   CLOSURE_STATIC,
//   META,
//   {},
// );
//
// assertEqual(conflict(scope, "def", BASE, "variable"), undefined);
//
// const body = concat(
//   makeDeclareStatements(scope, "def", BASE, "variable", null, []),
//   makeInitializeStatements(
//     scope,
//     "def",
//     BASE,
//     "variable",
//     makeLiteralExpression("init"),
//   ),
//   [
//     makeEffectStatement(
//       makeExpressionEffect(
//         makeLookupExpression(scope, BASE, "variable", makeRead()),
//       ),
//     ),
//     makeEffectStatement(
//       makeLookupEffect(
//         scope,
//         BASE,
//         "variable",
//         makeWrite(makeLiteralExpression("right")),
//       ),
//     ),
//   ],
// );
//
// const {header, prelude} = harvest([CLOSURE_STATIC, DEFINE_STATIC], scope);
//
// assertSuccess(
//   allignBlock(
//     makeBlock([], header, concat(prelude, body)),
//     `{
//       let VARIABLE;
//       VARIABLE = 'init';
//       effect(VARIABLE);
//       VARIABLE = 'right';
//     }`,
//   ),
// );
