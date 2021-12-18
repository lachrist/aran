import {assertEqual} from "../__fixture__.mjs";

import {createCounter} from "../util.mjs";

import {makeMetaVariable} from "../variable.mjs";
import {makeEmptyBreakLabel} from "../label.mjs";

import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../ast/index.mjs";

import {parseProgram, parseBlock} from "../lang/index.mjs";

import {allignProgram, allignBlock} from "../allign/index.mjs";

import {visitProgram, visitBlock} from "./visit.mjs";

import {createRootScope} from "./scope.mjs";

const makeContext = (namespace, pointcut) => ({
  scope: createRootScope(),
  counter: createCounter(),
  kind: null,
  header: [],
  script: null,
  trap: {
    namespace,
    pointcut,
  },
});

const generateTest = (parse, allign, visit) => (context, code1, code2) => {
  assertEqual(allign(visit(context, parse(code1)), code2), null);
};
const testProgram = generateTest(parseProgram, allignProgram, visitProgram);
const testBlock = generateTest(parseBlock, allignBlock, visitBlock);

const generateTestIdentity = (test) => (code) => {
  test(makeContext(null, false), code, code);
};
const testProgramIdentity = generateTestIdentity(testProgram);
const testBlockIdentity = generateTestIdentity(testBlock);

/////////////
// Program //
/////////////

// Script (unoptimized) //
testProgram(
  {
    ...makeContext("traps", ["dynamic-import"]),
    script: "scope",
  },
  `"script"; return import("source");`,
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
      "1:17",
    );
  `,
);

// (ScriptProgram optimized) //
testProgramIdentity(`"script"; return 123;`);

testProgramIdentity(`"eval"; [$this]; let _variable; { return _variable; }`);

// ModuleProgram //
testProgramIdentity(`
  "module";
  import {specifier1} from "source";
  export {specifier2};
  export {specifier3 as specifier4} from "source";
  {
    return 123;
  }
`);

///////////
// Block //
///////////

testBlockIdentity(`label: {let _variable; debugger;}`);

testBlock(
  makeContext("traps", ["break", "read"]),
  `${makeEmptyBreakLabel("label")}: {
    let _${makeMetaVariable("variable")};
    break ${makeEmptyBreakLabel("label")};
    effect(_${makeMetaVariable("variable")});
  }`,
  `label: {
    let _LAB, _NEW, _OLD;
    _LAB = {
      __proto__: null,
      ["kind"]: "break",
      ["name"]: null,
      ["identifier"]: "${makeEmptyBreakLabel("label")}",
    };
    _NEW = {
      __proto__:null,
      ["kind"]: "meta",
      ["name"]: "variable",
      ["identifier"]: "${makeMetaVariable("variable")}",
    };
    effect(
      intrinsic("Reflect.get")
        (undefined, $traps, "break")
        ($traps, _LAB, "3:4")
    );
    break label;
    effect(
      intrinsic("Reflect.get")
        (undefined, $traps, "read")
        ($traps, _NEW, _OLD, "4:11")
    );
  }`,
);

testBlock(
  {
    ...makeContext("traps", ["leave"]),
    header: [
      makeEffectStatement(makeExpressionEffect(makeLiteralExpression(456))),
    ],
  },
  `{ effect(123); }`,
  `{
    effect(456);
    try {
      effect(123);
    } catch {
      effect(throwError(intrinsic("Reflect.get")(undefined, input, "error")));
    } finally {
      effect(
        intrinsic("Reflect.get")(undefined, $traps, "leave")($traps, "1:0"),
      );
    }
  }`,
);

///////////////
// Statement //
///////////////

testBlockIdentity(`{ debugger; }`);
testBlockIdentity(`label: { break label; }`);
testBlockIdentity(`{ return 123; }`);
testBlockIdentity(`{ effect(123); }`);
testBlockIdentity(`{ let $variable = 123; }`);

testBlockIdentity(`{ { effect(123); } }`);
testBlockIdentity(`{ while (123) { effect(456); } }`);
testBlockIdentity(`{ if (123) { effect(456); } else { effect(789); } }`);
testBlockIdentity(
  `{ try { effect(123); } catch { effect(456); } finally { effect(789); } }`,
);

////////////
// Effect //
////////////

testBlockIdentity(`{ effect(123); }`);
testBlockIdentity(`{ let _variable; _variable = 123; }`);
testBlockIdentity(`{ exportStatic("specifier", 123); }`);
testBlockIdentity(`{ (effect(123), effect(456)); }`);
testBlockIdentity(`{ 123 ? effect(456) : effect(789); }`);
testBlockIdentity(`{ $variable = 123; }`);
testBlockIdentity(`{ $super[123] = 456; }`);

////////////////
// Expression //
////////////////

testBlock(
  makeContext("traps", ["arrival"]),
  `{ effect(() => { return 123; }); }`,
  `{
    let _callee;
    effect(
      (
        _callee = () => {
          effect(
            intrinsic
              ("Reflect.get")
              (undefined, $traps, "arrival")
              ($traps, "arrow", null, _callee, "1:9")
          );
          return 123;
        },
        _callee
      )
    );
  }`,
);
testBlockIdentity(`{ effect(() => { return 123; }); }`);

testBlockIdentity(`{ effect(input); }`);
testBlockIdentity(`{ effect(intrinsic("ReferenceError")); }`);
testBlockIdentity(`{ effect(123); }`);
testBlockIdentity(`{ effect(importStatic("source", "specifier")); }`);
testBlockIdentity(`{ let _variable; effect(_variable); }`);

testBlockIdentity(`{ effect($variable); }`);
testBlockIdentity(`{ effect(typeof $variable); }`);
testBlockIdentity(`{ effect($super[123]); }`);
testBlockIdentity(`{ effect($super(...123)); }`);

testBlockIdentity(`{ effect((effect(123), 456)); }`);
testBlockIdentity(`{ effect(123 ? 456 : 789); }`);
testBlockIdentity(`{ effect(await 123); }`);
testBlockIdentity(`{ effect(yieldStraight(123)); }`);
testBlockIdentity(`{ effect(yieldDelegate(123)); }`);
testBlockIdentity(`{ effect(throwError(123)); }`);
testBlockIdentity(
  `{ let _variable; effect(eval([$this], [_variable], 123)); }`,
);

testBlockIdentity(`{ effect(import(123)); }`);
testBlockIdentity(`{ effect(123(456, 789)); }`);
testBlockIdentity(`{ effect(new 123(456)); }`);
testBlockIdentity(`{ effect(!123); }`);
testBlockIdentity(`{ effect(123 + 456); }`);
testBlockIdentity(`{ effect({__proto__:123, [456]:789}); }`);
