import {assertEqual} from "../__fixture__.mjs";
import {
  // makeDebuggerStatement,
  makeEffectStatement,
  makeExpressionEffect,
} from "../ast/index.mjs";
import {makeFullBreakLabel} from "../label.mjs";
import {makeBaseVariable} from "../variable.mjs";
import {allignBlock} from "../allign/index.mjs";
import {
  makeRootScope,
  registerNewVariable,
  makeOldReadExpression,
  makeNewReadExpression,
  makeVarReadExpression,
  makeLabReadExpression,
  makeNewWriteEffect,
  makeScopeBlock,
  makeOldWriteEffect,
  // makeScopeScriptProgram,
} from "./scope.mjs";

{
  const label = makeFullBreakLabel("label");
  const old_variable = makeBaseVariable("variable");
  assertEqual(
    allignBlock(
      makeScopeBlock(makeRootScope(), [label], [old_variable], (scope) => {
        const new_variable = registerNewVariable(scope);
        return [
          makeEffectStatement(
            makeExpressionEffect(makeLabReadExpression(scope, label)),
          ),
          makeEffectStatement(
            makeExpressionEffect(makeVarReadExpression(scope, old_variable)),
          ),
          makeEffectStatement(
            makeOldWriteEffect(
              scope,
              old_variable,
              makeOldReadExpression(scope, old_variable),
            ),
          ),
          makeEffectStatement(
            makeNewWriteEffect(
              scope,
              new_variable,
              makeNewReadExpression(scope, new_variable),
            ),
          ),
        ];
      }),
      `label: {
        let _old_var, _lab_var, _var_var, _new_var;
        _lab_var = {__proto__:null};
        _var_var = {__proto__:null};
        effect(_lab_var);
        effect(_var_var);
        _old_var = _old_var;
        _new_var = _new_var;
      }`,
    ),
    null,
  );
}
