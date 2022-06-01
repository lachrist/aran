import {assertSuccess} from "../__fixture__.mjs";

import {createCounter} from "../util/index.mjs";

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
  unmangleVariable: (variable) => ({variable}),
  unmangleLabel: (label) => ({label}),
  scope: createRootScope(),
  counter: createCounter(0),
  kind: null,
  header: [],
  script: null,
  trap: {
    namespace,
    pointcut,
  },
});

const generateTest = (parse, allign, visit) => (context, code1, code2) => {
  assertSuccess(allign(visit(context, parse(code1)), code2));
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
    let scope = intrinsic.aran.createObject(null);
    effect(
      intrinsic.aran.getGlobal("traps")["arrival"](
        "script",
        null,
        null,
        "1:0",
      ),
    );
    return (
      effect(
        intrinsic.aran.setStrict(
          intrinsic.aran.getGlobal("scope"),
          "Ncallee1",
          () => {
            effect(
              intrinsic.aran.getGlobal("traps")["arrival"](
                "arrow",
                null,
                intrinsic.aran.get(
                  intrinsic.aran.getGlobal("scope"),
                  "Ncallee1",
                ),
                "1:17",
              ),
            );
            return 123;
          },
        ),
      ),
      intrinsic.aran.get(
        intrinsic.aran.getGlobal("scope"),
        "Ncallee1",
      )
    );
  `,
);

// (ScriptProgram optimized) //
testProgramIdentity(`"script"; return 123;`);

// EnclaveEvalProgram //
testProgramIdentity(`"external"; ["this", "new.target"]; { return 123; }`);

// LocalEvalProgram //
testProgramIdentity(
  `
    "internal";
    let variable1, variable2;
    {
      return variable1;
    }
  `,
);

// GlobalEvalProgram //
testProgramIdentity(`"eval"; { return 123; }`);

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

testBlockIdentity(`label: {let variable; debugger;}`);

testBlock(
  {
    ...makeContext("traps", ["break", "read"]),
    header: [],
    kind: "block",
  },
  `label: {
    let variable;
    break label;
    effect(variable);
  }`,
  `label: {
    let _LAB, _VAR, _OLD;
    _LAB = intrinsic.aran.createObject(null, "label", "label");
    _VAR = intrinsic.aran.createObject(null, "variable", "variable");
    effect(
      intrinsic.aran.getGlobal("traps")["break"](_LAB, "3:4"),
    );
    break label;
    effect(
      intrinsic.aran.getGlobal("traps")["read"](_VAR, _OLD, "4:11"),
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
        intrinsic.aran.throw(
          intrinsic.aran.get(input, "error"),
        ),
      );
    } finally {
      effect(
        intrinsic.aran.getGlobal("traps")["leave"]("1:0"),
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
testBlockIdentity(`{ effect(intrinsic.ReferenceError); }`);
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

// testBlockIdentity(`{ effect(123[456](789)); }`);
// {
//   let done = false;
//   testBlock(
//     makeContext("traps", {
//       __proto__: null,
//       apply: () => {
//         if (done) {
//           return false;
//         } else {
//           done = true;
//           return true;
//         }
//       },
//     }),
//     `{ effect(123[456](789)); }`,
//     `{
//       let this1;
//       effect(
//         intrinsic.aran.getGlobal("traps")["apply"](
//           (
//             this1 = 123,
//             intrinsic.aran.get(this1, 456)
//           ),
//           this1,
//           intrinsic.Array.of(789),
//         ),
//       );
//     }`,
//   );
// }
