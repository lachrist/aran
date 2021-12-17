import {assertEqual, assertDeepEqual} from "../__fixture__.mjs";
import {makeBlock, makeLiteralExpression} from "../ast/index.mjs";
import {allignBlock, allignExpression} from "../allign/index.mjs";

import {extendScope, createRootScope, declareScopeVariable} from "./scope.mjs";

import {makeTrapExpression, makeTrapStatementArray} from "./trap.mjs";

////////////
// bypass //
////////////
assertEqual(
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
  null,
);

////////////
// object //
////////////
assertEqual(
  allignExpression(
    makeTrapExpression(
      {
        namespace: "namespace",
        pointcut: (...args) => {
          assertDeepEqual(args, ["object", null, [[null, null]], 123]);
          return true;
        },
      },
      "object",
      makeLiteralExpression("prototype"),
      [[makeLiteralExpression("key"), makeLiteralExpression("value")]],
      123,
    ),
    `intrinsic("Reflect.get")(undefined, $namespace, "object")(
      $namespace,
      "prototype",
      intrinsic("Array.of")(
        undefined,
        intrinsic("Array.of")(
          undefined,
          "key",
          "value",
        ),
      ),
      123,
    );`,
  ),
  null,
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
  assertEqual(
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
          intrinsic("Reflect.get")(undefined, $namespace, "arrival")(
            $namespace,
            "kind",
            intrinsic("Array.of")(
              undefined,
              {__proto__:null, ["link_key"]:"link_value"},
            ),
            _callee,
            123,
          ),
        );
      }`,
    ),
    null,
  );
}

/////////////////////
// arrival (empty) //
/////////////////////
assertEqual(
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
        intrinsic("Reflect.get")(undefined, $namespace, "arrival")(
          $namespace,
          "kind",
          null,
          null,
          123,
        ),
      );
    }`,
  ),
  null,
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
  assertEqual(
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
          intrinsic("Reflect.get")(undefined, $namespace, "enter")(
            $namespace,
            "kind",
            intrinsic("Array.of")(undefined, _label),
            intrinsic("Array.of")(undefined, _variable),
            123,
          ),
        );
      }`,
    ),
    null,
  );
}
