import { concat } from "array-lite";

import { assertSuccess } from "../../__fixture__.mjs";

import {
  makeEvalProgram,
  makeReturnStatement,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import { allignBlock, allignProgram } from "../../allign/index.mjs";

import { BASE, META, makeMetaVariable } from "../variable.mjs";

import {
  createFrame,
  BLOCK_STATIC,
  DEFINE_STATIC,
  ESCAPE,
  MACRO,
} from "./frame.mjs";

import {
  ROOT_SCOPE,
  packScope,
  unpackScope,
  makeScopeFrameScriptProgram,
  makeScopeFrameBlock,
  declareScope,
  makeScopeInitializeStatementArray,
  makeScopeEvalExpression,
  makeScopeReadExpression,
} from "./scope.mjs";

const STRICT = false;

let packed_scope = null;

const spyScope = (scope, result) => {
  packed_scope = packScope(scope);
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
        declareScope(STRICT, scope, "const", "variable", { exports: [] });
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
            "variable",
            makeLiteralExpression("right"),
          ),
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(STRICT, scope, "variable", null),
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
        void eval("code");
        variable = "right";
        initialized = true;
        void variable;
      }
    `,
  ),
);

assertSuccess(
  allignProgram(
    makeEvalProgram(
      makeScopeFrameBlock(
        STRICT,
        unpackScope(packed_scope),
        [],
        [createFrame(MACRO, META, {})],
        (scope) => {
          declareScope(
            STRICT,
            scope,
            "macro",
            makeMetaVariable("VARIABLE", 123),
            {
              pure: makeLiteralExpression(123),
            },
          );
          return [
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(
                  STRICT,
                  scope,
                  makeMetaVariable("VARIABLE", 123),
                  null,
                ),
              ),
            ),
            makeEffectStatement(
              makeExpressionEffect(
                makeScopeReadExpression(
                  STRICT,
                  {
                    car: createFrame(ESCAPE, BASE, {}),
                    cdr: scope,
                  },
                  "variable",
                  null,
                ),
              ),
            ),
            makeReturnStatement(makeLiteralExpression("completion")),
          ];
        },
      ),
    ),
    `
      "eval";
      {
        void 123;
        void (
          initialized ?
          variable :
          intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              "Cannot access variable \\"variable\\" before initialization",
            ),
          )
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
        declareScope(
          STRICT,
          scope,
          "macro",
          makeMetaVariable("variable", 123),
          {
            pure: makeLiteralExpression("binding"),
          },
        );
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeScopeReadExpression(
                STRICT,
                scope,
                makeMetaVariable("variable", 123),
                null,
              ),
            ),
          ),
          makeReturnStatement(makeLiteralExpression("completion")),
        ];
      },
    ),
    `
      "script";
      void "binding";
      return "completion";
    `,
  ),
);
