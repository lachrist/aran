import {concat} from "array-lite";

import {createCounter} from "../../util/index.mjs";

import {assertSuccess} from "../../__fixture__.mjs";

import {
  makeReturnStatement,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {allignBlock, allignProgram} from "../../allign/index.mjs";

import {BASE, META} from "./variable.mjs";

import {packScope, unpackScope, encloseScope} from "./core.mjs";

import {createRootScope} from "./binding.mjs";

import {
  createFrame,
  BLOCK_STATIC,
  DEFINE_STATIC,
  MACRO,
} from "./frame/index.mjs";

import {
  makeScopeFrameInternalLocalEvalProgram,
  makeScopeFrameScriptProgram,
  makeScopeFrameBlock,
  declareScope,
  makeScopeInitializeStatementArray,
  makeScopeEvalExpression,
  makeScopeReadExpression,
} from "./frame.mjs";

const {
  JSON: {stringify: stringifyJSON, parse: parseJSON},
} = globalThis;

let serialized_scope = null;

const spyScope = (scope, result) => {
  serialized_scope = stringifyJSON(packScope(scope));
  return result;
};

assertSuccess(
  allignBlock(
    makeScopeFrameBlock(
      createRootScope(createCounter(123)),
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
                spyScope(
                  scope,
                  makeScopeEvalExpression(scope, makeLiteralExpression("code")),
                ),
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
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(scope, BASE, "variable", null),
              ),
            ),
          ],
        );
      },
    ),
    `
      label: {
        let variable, initialized;
        initialized = false;
        effect(
          eval([variable, initialized], "code"),
        );
        variable = "right";
        initialized = true;
        effect(variable);
      }
    `,
  ),
);

assertSuccess(
  allignProgram(
    makeScopeFrameInternalLocalEvalProgram(
      unpackScope(parseJSON(serialized_scope)),
      [createFrame(MACRO, META, {})],
      (scope) => {
        declareScope(scope, "macro", META, "VARIABLE", {
          binding: makeLiteralExpression(123),
        });
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(scope, META, "VARIABLE"),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(encloseScope(scope), BASE, "variable"),
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
    `
      "internal";
      let variable, initialized;
      {
        effect(123);
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
        return "completion";
      }
    `,
  ),
);

assertSuccess(
  allignProgram(
    makeScopeFrameScriptProgram(
      createRootScope(createCounter(0)),
      [createFrame(MACRO, META, {})],
      (scope) => {
        declareScope(scope, "macro", META, "variable", {
          binding: makeLiteralExpression("binding"),
        });
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(scope, META, "variable"),
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
    `
      "script";
      effect("binding");
      return "completion";
    `,
  ),
);
