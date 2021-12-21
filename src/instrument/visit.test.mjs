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
    ...makeContext("traps", ["arrival"]),
    script: "scope",
  },
  `"script"; return () => { return 123; }`,
  `
    "script";
    let scope = intrinsic("aran.createObject")(undefined, null);
    effect(
      intrinsic("aran.readGlobal")(undefined, "traps")["arrival"](
        "script",
        null,
        null,
        "1:0",
      ),
    );
    return (
      effect(
        intrinsic("aran.setStrict")(
          undefined,
          intrinsic("aran.readGlobal")(undefined, "scope"),
          "Ncallee1",
          () => {
            effect(
              intrinsic("aran.readGlobal")(undefined, "traps")["arrival"](
                "arrow",
                null,
                intrinsic("aran.get")(
                  undefined,
                  intrinsic("aran.readGlobal")(undefined, "scope"),
                  "Ncallee1",
                ),
                "1:17",
              ),
            );
            return 123;
          },
        ),
      ),
      intrinsic("aran.get")(
        undefined,
        intrinsic("aran.readGlobal")(undefined, "scope"),
        "Ncallee1",
      )
    );
  `,
);

// (ScriptProgram optimized) //
testProgramIdentity(`"script"; return 123;`);

// EnclaveEvalProgram //
testProgramIdentity(`"enclave eval"; ["this", "new.target"]; { return 123; }`);

// LocalEvalProgram //
testProgramIdentity(
  `"local eval"; let variable1, variable2; { return variable1; }`,
);

// GlobalEvalProgram //
testProgramIdentity(`"global eval"; { return 123; }`);

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
  {
    ...makeContext("traps", ["break", "read"]),
    header: [],
    kind: "block",
  },
  `${makeEmptyBreakLabel("label")}: {
    let ${makeMetaVariable("variable")};
    break ${makeEmptyBreakLabel("label")};
    effect(${makeMetaVariable("variable")});
  }`,
  `label: {
    let _LAB, _NEW, _OLD;
    _LAB = intrinsic("aran.createObject")(
      undefined, null,
      "kind", "break",
      "name", null,
      "identifier", "${makeEmptyBreakLabel("label")}",
    );
    _NEW = intrinsic("aran.createObject")(
      undefined, null,
      "kind", "meta",
      "name", "variable",
      "identifier", "${makeMetaVariable("variable")}",
    );
    effect(
      intrinsic("aran.readGlobal")(undefined, "traps")["break"](_LAB, "3:4"),
    );
    break label;
    effect(
      intrinsic("aran.readGlobal")(undefined, "traps")["read"](_NEW, _OLD, "4:11"),
    );
  }`,
);

testBlock(
  {
    ...makeContext("traps", ["leave"]),
    kind: "block",
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
      effect(
        intrinsic("aran.throw")(
          undefined,
          intrinsic("aran.get")(undefined, input, "error"),
        ),
      );
    } finally {
      effect(
        intrinsic("aran.readGlobal")(undefined, "traps")["leave"]("1:0"),
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
testBlockIdentity(`{ var variable = 123; }`);

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
testBlockIdentity(`{ let variable; variable = 123; }`);
testBlockIdentity(`{ exportStatic("specifier", 123); }`);
testBlockIdentity(`{ (effect(123), effect(456)); }`);
testBlockIdentity(`{ 123 ? effect(456) : effect(789); }`);

////////////////
// Expression //
////////////////

// testBlock(
//   makeContext("traps", ["arrival"]),
//   `{ effect(() => { return 123; }); }`,
//   `{
//     let _callee;
//     effect(
//       (
//         _callee = () => {
//           effect(
//             intrinsic
//               ("Reflect.get")
//               (undefined, $traps, "arrival")
//               ($traps, "arrow", null, _callee, "1:9")
//           );
//           return 123;
//         },
//         _callee
//       )
//     );
//   }`,
// );
testBlockIdentity(`{ effect(() => { return 123; }); }`);

testBlockIdentity(`{ effect(input); }`);
testBlockIdentity(`{ effect(intrinsic("ReferenceError")); }`);
testBlockIdentity(`{ effect(123); }`);
testBlockIdentity(`{ effect(importStatic("source", "specifier")); }`);
testBlockIdentity(`{ let variable; effect(variable); }`);

testBlockIdentity(`{ effect((effect(123), 456)); }`);
testBlockIdentity(`{ effect(123 ? 456 : 789); }`);
testBlockIdentity(`{ effect(await 123); }`);
testBlockIdentity(`{ effect(yieldStraight(123)); }`);
testBlockIdentity(`{ effect(yieldDelegate(123)); }`);
testBlockIdentity(`{ let variable; effect(eval([variable], 123)); }`);

testBlockIdentity(`{ effect(123(456, 789)); }`);
testBlockIdentity(`{ effect(new 123(456)); }`);
testBlockIdentity(`{ effect(123[456](789)); }`);
{
  let done = false;
  testBlock(
    makeContext("traps", {
      __proto__: null,
      apply: () => {
        if (done) {
          return false;
        } else {
          done = true;
          return true;
        }
      },
    }),
    `{ effect(123[456](789)); }`,
    `{
      let this1;
      effect(
        intrinsic("aran.readGlobal")(undefined, "traps")["apply"](
          (
            this1 = 123,
            intrinsic("aran.get")(undefined, this1, 456)
          ),
          this1,
          intrinsic("Array.of")(undefined, 789),
        ),
      );
    }`,
  );
}
