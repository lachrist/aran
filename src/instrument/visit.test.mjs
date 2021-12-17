/* eslint-disable no-unused-vars */

import {assertEqual} from "../__fixture__.mjs";

import {createCounter} from "../util.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../ast/index.mjs";

import {parseProgram, parseBlock} from "../lang/index.mjs";

import {
  allignProgram,
  allignBlock,
  allignStatement,
  allignEffect,
  allignExpression,
} from "../allign/index.mjs";

import {
  visitProgram,
  visitLink,
  visitBlock,
  visitStatement,
  visitEffect,
  visitExpression,
} from "./visit.mjs";

import {createRootScope} from "./scope.mjs";

const makeContext = (namespace, pointcut) => ({
  scope: createRootScope(),
  counter: createCounter(),
  kind: null,
  header: null,
  script: null,
  trap: {
    namespace,
    pointcut,
  },
});

const generateTestIdentity = (parse, allign, visit) => (code) => {
  assertEqual(allign(visit(makeContext(false, null), parse(code)), code), null);
};

/////////////
// Program //
/////////////

// Script (unoptimized) //
assertEqual(
  allignProgram(
    visitProgram(
      {
        ...makeContext("traps", ["dynamic-import"]),
        script: "scope",
      },
      parseProgram(
        `
          "script";
          return import("source");
        `,
      ),
    ),
    `
      "script";
      let $scope = {__proto__:null};
      effect(
        intrinsic("Reflect.set")(
          undefined,
          $scope,
          "Nimport",
          () => {
            return import(intrinsic("Reflect.get")(undefined, input, 0));
          },
        ),
      );
      return (intrinsic("Reflect.get")(undefined, $traps, "dynamic-import"))(
        $traps,
        intrinsic("Reflect.get")(undefined, $scope, "Nimport"),
        "source",
        "3:17",
      );
    `,
  ),
  null,
);

// (ScriptProgram optimized) //
{
  const code = `"script"; return 123;`;
  assertEqual(
    allignProgram(
      visitProgram(makeContext(null, false), parseProgram(code)),
      code,
    ),
    null,
  );
}

// ModuleProgram //
{
  const code = `
    "module";
    import {specifier1} from "source";
    export {specifier2};
    export {specifier3 as specifier4} from "source";
    {
      return 123;
    }
  `;
  assertEqual(
    allignProgram(
      visitProgram(makeContext(null, false), parseProgram(code)),
      code,
    ),
    null,
  );
}

///////////
// Block //
///////////

// Block (optimized) //
assertEqual(
  allignBlock(
    visitBlock(
      {
        ...makeContext(null, false),
        header: [
          makeEffectStatement(makeExpressionEffect(makeLiteralExpression(456))),
        ],
      },
      parseBlock(`label: {let _variable; effect(123);}`),
    ),
    `label: {let _variable; effect(456); effect(123); }`,
  ),
  null,
);

// Block (unoptimized) //
assertEqual(
  allignBlock(
    visitBlock(
      {
        ...makeContext("traps", ["leave"]),
        header: [],
      },
      parseBlock(`{ debugger; }`),
    ),
    `{
      try {
        debugger;
      } catch {
        effect(throwError(intrinsic("Reflect.get")(undefined, input, "error")));
      } finally {
        effect(
          intrinsic("Reflect.get")(undefined, $traps, "leave")($traps, "1:0"),
        );
      }
    }`,
  ),
  null,
);

////////////
// Effect //
////////////
