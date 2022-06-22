import {concat} from "array-lite";

import {assertSuccess} from "../../__fixture__.mjs";

import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignBlock} from "../../allign/index.mjs";

import {BASE, META} from "./variable.mjs";

import {enclose} from "./core.mjs";

import {createRoot} from "./binding.mjs";

import {createFrame, BLOCK_STATIC, DEFINE_STATIC} from "./frame/index.mjs";

import {
  makeScopeBlock,
  declareScope,
  makeScopeInitializeStatementArray,
  makeScopeEvalExpression,
  makeScopeReadExpression,
} from "./scope.mjs";

assertSuccess(
  allignBlock(
    makeScopeBlock(
      createRoot(123),
      ["label"],
      [
        createFrame(BLOCK_STATIC, BASE, {}),
        createFrame(DEFINE_STATIC, META, {}),
      ],
      (scope) => {
        declareScope(scope, "const", BASE, "variable", {exports: []});
        return concat(
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(enclose(scope), BASE, "variable", null),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeEvalExpression(scope, makeLiteralExpression("code")),
              ),
            ),
          ],
          makeScopeInitializeStatementArray(
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
        effect(
          eval([variable, initialized], "code"),
        );
        variable = "right";
        initialized = true;
      }
    `,
  ),
);
