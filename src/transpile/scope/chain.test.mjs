import {concat} from "array-lite";

import {assertSuccess} from "../../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {BASE, META} from "./variable.mjs";

import {enclose} from "./structure.mjs";

import {createRoot} from "./property.mjs";

import {
  create as createFrame,
  BLOCK_STATIC,
  DEFINE_STATIC,
} from "./frame/index.mjs";

import {
  makeBlock,
  declare,
  makeInitializeStatementArray,
  makeReadExpression,
} from "./chain.mjs";

assertSuccess(
  allignBlock(
    makeBlock(
      createRoot(123),
      ["label"],
      [
        createFrame(BLOCK_STATIC, BASE, {}),
        createFrame(DEFINE_STATIC, META, {}),
      ],
      (scope) => {
        declare(scope, "const", BASE, "variable", {exports: []});
        return concat(
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeReadExpression(enclose(scope), BASE, "variable", null),
              ),
            ),
          ],
          makeInitializeStatementArray(
            scope,
            "const",
            BASE,
            "variable",
            makeLiteralExpression("right"),
          ),
        );
      },
    ),
    `
      label: {
        let variable, initialized;
        initialized = false;
        effect(
          (
            initialized ?
            variable :
            intrinsic.aran.throw(
              new intrinsic.ReferenceError(
                "Cannot access variable 'variable' before initialization",
              ),
            )
          ),
        );
        variable = 'right';
        initialized = true;
      }
    `,
  ),
);
