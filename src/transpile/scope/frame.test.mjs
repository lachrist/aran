import { concat } from "array-lite";

import { assertSuccess } from "../../__fixture__.mjs";

import {
  makeReturnStatement,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import { allignBlock, allignProgram } from "../../allign/index.mjs";

import { BASE, META } from "./variable.mjs";

import { ROOT_SCOPE, packScope, unpackScope, encloseScope } from "./core.mjs";

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
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

const STRICT = false;

let serialized_scope = null;

const spyScope = (scope, result) => {
  serialized_scope = stringifyJSON(packScope(scope));
  return result;
};

assertSuccess(
  allignBlock(
    makeScopeFrameBlock(
      STRICT,
      ROOT_SCOPE,
      ["label"],
      [
        createFrame(BLOCK_STATIC, BASE, {}),
        createFrame(DEFINE_STATIC, META, {}),
      ],
      (scope) => {
        declareScope(STRICT, scope, "const", BASE, "variable", { exports: [] });
        return concat(
          [
            makeEffectStatement(
              makeExpressionEffect(
                spyScope(
                  scope,
                  makeScopeEvalExpression(
                    STRICT,
                    scope,
                    makeLiteralExpression("code"),
                  ),
                ),
              ),
            ),
          ],
          makeScopeInitializeStatementArray(
            STRICT,
            scope,
            "const",
            BASE,
            "variable",
            makeLiteralExpression("right"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(STRICT, scope, BASE, "variable", null),
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
      STRICT,
      unpackScope(parseJSON(serialized_scope)),
      [createFrame(MACRO, META, {})],
      (scope) => {
        declareScope(STRICT, scope, "macro", META, "VARIABLE", {
          binding: makeLiteralExpression(123),
        });
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(STRICT, scope, META, "VARIABLE", null),
            ),
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(
                STRICT,
                encloseScope(scope),
                BASE,
                "variable",
                null,
              ),
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
      STRICT,
      ROOT_SCOPE,
      [createFrame(MACRO, META, {})],
      (scope) => {
        declareScope(STRICT, scope, "macro", META, "variable", {
          binding: makeLiteralExpression("binding"),
        });
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(STRICT, scope, META, "variable", null),
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
