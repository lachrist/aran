import {assertEqual} from "../__fixture__.mjs";
import {makeCounter} from "../util.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeReturnStatement,
  makePrimitiveExpression,
} from "../ast/index.mjs";
import {makeFullBreakLabel} from "../label.mjs";
import {makeBaseVariable} from "../variable.mjs";
import {allignBlock, allignProgram} from "../allign/index.mjs";
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
  makeScopeScriptProgram,
} from "./scope.mjs";

////////////////
// Old && Var //
////////////////

{
  const old_variable = makeBaseVariable("variable");
  assertEqual(
    allignBlock(
      makeScopeBlock(makeRootScope(), [], [old_variable], (scope) => [
        makeEffectStatement(
          makeOldWriteEffect(
            scope,
            old_variable,
            makeOldReadExpression(scope, old_variable),
          ),
        ),
        makeEffectStatement(
          makeExpressionEffect(makeVarReadExpression(scope, old_variable)),
        ),
      ]),
      `{
        let _old_var, _var_var;
        _var_var = {
          __proto__:null,
          ["kind"]: "base",
          ["name"]: "variable",
          ["identifier"]: "${old_variable}",
        };
        _old_var = _old_var;
        effect(_var_var);
      }`,
    ),
    null,
  );
}

/////////
// Lab //
/////////

{
  const label = makeFullBreakLabel("label");
  assertEqual(
    allignBlock(
      makeScopeBlock(makeRootScope(), [label], [], (scope) => [
        makeEffectStatement(
          makeExpressionEffect(makeLabReadExpression(scope, label)),
        ),
      ]),
      `label: {
        let _lab_var;
        _lab_var = {
          __proto__:null,
          ["kind"]: "break",
          ["name"]: "label",
          ["identifier"]: "${label}",
        };
        effect(_lab_var);
      }`,
    ),
    null,
  );
}

/////////
// New //
/////////

assertEqual(
  allignBlock(
    makeScopeBlock(makeRootScope(), [], [], (scope) => {
      const new_variable = registerNewVariable(scope);
      return [
        makeEffectStatement(
          makeNewWriteEffect(
            scope,
            new_variable,
            makeNewReadExpression(scope, new_variable),
          ),
        ),
      ];
    }),
    `{
      let _new_var;
      _new_var = _new_var;
    }`,
  ),
  null,
);

/////////
// Try //
/////////

{
  const makePrimitiveStatement = (primitive) =>
    makeEffectStatement(
      makeExpressionEffect(makePrimitiveExpression(primitive)),
    );
  const label = makeFullBreakLabel("label");
  const variable = makeBaseVariable("variable");
  assertEqual(
    allignBlock(
      makeScopeBlock(makeRootScope(), [label], [variable], (scope) => ({
        head: [
          makePrimitiveStatement("head"),
          makeEffectStatement(
            makeExpressionEffect(makeOldReadExpression(scope, variable)),
          ),
        ],
        try: [makePrimitiveStatement("try")],
        catch: [makePrimitiveStatement("catch")],
        finally: [makePrimitiveStatement("finally")],
        tail: [makePrimitiveStatement("tail")],
      })),
      `label: {
        let _old_var;
        effect("head");
        effect(_old_var);
        try {
          effect("try");
        } catch {
          effect("catch");
        } finally {
          effect("finally");
        }
        effect("tail");
      }`,
    ),
    null,
  );
}

////////////
// Script //
////////////

assertEqual(
  allignProgram(
    makeScopeScriptProgram("prefix", makeCounter(), (scope) => {
      const new_variable = registerNewVariable(scope);
      return [
        makeEffectStatement(
          makeNewWriteEffect(
            scope,
            new_variable,
            makeNewReadExpression(scope, new_variable),
          ),
        ),
        makeReturnStatement(makePrimitiveExpression("completion")),
      ];
    }),
    `
      "script";
      let $Nprefix1 = undefined;
      $Nprefix1 = $Nprefix1;
      return "completion";
    `,
  ),
  null,
);
