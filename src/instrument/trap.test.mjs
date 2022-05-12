import {assertDeepEqual, assertSuccess} from "../__fixture__.mjs";
import {makeBlock, makeLiteralExpression} from "../ast/index.mjs";
import {allignBlock, allignExpression} from "../allign/index.mjs";

import {extendScope, createRootScope, declareScopeVariable} from "./scope.mjs";

import {makeTrapExpression, makeTrapStatementArray} from "./trap.mjs";

const {String} = globalThis;

////////////
// bypass //
////////////
assertSuccess(
  allignExpression(
    makeTrapExpression(
      {
        namespace: "namespace",
        pointcut: (...args) => {
          assertDeepEqual(args, ["literal", 123n, 456]);
          return false;
        },
      },
      "literal",
      {bigint: "123"},
      456,
    ),
    `123n;`,
  ),
);

////////////////////
// arrival (full) //
////////////////////
{
  const scope = extendScope(createRootScope());
  declareScopeVariable(scope, {
    variable: "callee",
    value: "callee-data",
    duplicable: false,
    initialized: false,
  });
  assertSuccess(
    allignBlock(
      makeBlock(
        [],
        ["callee"],
        makeTrapStatementArray(
          {
            namespace: "namespace",
            pointcut: (...args) => {
              assertDeepEqual(args, [
                "arrival",
                "kind",
                [{__proto__: null, link_key: "link_value"}],
                "callee-data",
                123,
              ]);
              return true;
            },
          },
          "arrival",
          "kind",
          [{__proto__: null, link_key: "link_value"}],
          [scope, "callee"],
          123,
        ),
      ),
      `{
        let _callee;
        effect(
          intrinsic.aran.getGlobal("namespace")["arrival"](
            "kind",
            intrinsic.Array.of(
              intrinsic.aran.createObject(
                null,
                "link_key",
                "link_value",
              ),
            ),
            _callee,
            123,
          ),
        );
      }`,
    ),
  );
}

/////////////////////
// arrival (empty) //
/////////////////////
assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      makeTrapStatementArray(
        {
          namespace: "namespace",
          pointcut: (...args) => {
            assertDeepEqual(args, ["arrival", "kind", null, null, 123]);
            return true;
          },
        },
        "arrival",
        "kind",
        null,
        null,
        123,
      ),
    ),
    `{
      effect(
        intrinsic.aran.getGlobal("namespace")["arrival"](
          "kind",
          null,
          null,
          123,
        ),
      );
    }`,
  ),
);

///////////
// enter //
///////////
{
  const scope = extendScope(createRootScope());
  declareScopeVariable(scope, {
    variable: "variable",
    value: "variable-data",
    duplicable: false,
    initialized: false,
  });
  declareScopeVariable(scope, {
    variable: "label",
    value: "label-data",
    duplicable: false,
    initialized: false,
  });
  assertSuccess(
    allignBlock(
      makeBlock(
        [],
        ["label", "variable"],
        makeTrapStatementArray(
          {
            namespace: "namespace",
            pointcut: (...args) => {
              assertDeepEqual(args, [
                "enter",
                "kind",
                ["label-data"],
                ["variable-data"],
                123,
              ]);
              return true;
            },
          },
          "enter",
          "kind",
          [[scope, "label"]],
          [[scope, "variable"]],
          123,
        ),
      ),
      `{
        let _label, _variable;
        effect(
          intrinsic.aran.getGlobal("namespace")["enter"](
            "kind",
            intrinsic.Array.of(_label),
            intrinsic.Array.of(_variable),
            123,
          ),
        );
      }`,
    ),
  );
}

////////////
// Invoke //
////////////
assertSuccess(
  allignExpression(
    makeTrapExpression(
      {
        namespace: "namespace",
        pointcut: ["apply"],
      },
      "invoke",
      (cut) => makeLiteralExpression(`object_${String(cut)}`),
      (cut) => makeLiteralExpression(`key_${String(cut)}`),
      [makeLiteralExpression("argument")],
    ),
    `intrinsic.aran.getGlobal("namespace")["apply"](
      "object_true",
      "key_true",
      intrinsic.Array.of("argument"),
    )`,
  ),
);
