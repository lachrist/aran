import { createCounter } from "../../util/index.mjs";
import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import { makeScopeTestBlock, ROOT_SCOPE } from "../scope/index.mjs";
import {
  makeMacro,
  makeMacroSelf,
  toMacroExpression,
  annotateMacro,
} from "./macro.mjs";

allignBlock(
  makeScopeTestBlock(
    { strict: false, scope: ROOT_SCOPE, counter: createCounter(0) },
    (context) => [
      makeEffectStatement(
        makeExpressionEffect(
          toMacroExpression(
            annotateMacro(
              makeMacro(context, "macro", makeLiteralExpression("macro")),
              "annotation",
            ),
          ),
        ),
      ),
    ],
  ),
  `
    {
      let macro;
      void (macro = "macro", macro);
    }
  `,
);

allignBlock(
  makeScopeTestBlock(
    { strict: false, scope: ROOT_SCOPE, counter: createCounter(0) },
    (context) => [
      makeEffectStatement(
        makeExpressionEffect(
          toMacroExpression(
            annotateMacro(
              makeMacroSelf(context, "macro", (expression) => expression),
              "annotation",
            ),
          ),
        ),
      ),
    ],
  ),
  `
    {
      let macro;
      void (macro = macro, macro);
    }
  `,
);
