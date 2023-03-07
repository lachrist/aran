import { createCounter } from "../../util/index.mjs";
import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import { makeScopeTestBlock, ROOT_SCOPE } from "../scope/index.mjs";
import { makeMacro, makeMacroSelf, toMacroExpression } from "./macro.mjs";

allignBlock(
  makeScopeTestBlock(
    { strict: false, scope: ROOT_SCOPE, counter: createCounter(0) },
    (context) => [
      makeEffectStatement(
        makeExpressionEffect(
          toMacroExpression(
            makeMacro(context, "macro", makeLiteralExpression("macro")),
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
            makeMacroSelf(context, "macro", (expression) => expression),
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
