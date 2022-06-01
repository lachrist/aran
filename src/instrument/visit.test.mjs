import {assertSuccess} from "../__fixture__.mjs";

import {createCounter} from "../util/index.mjs";

import {parseProgram} from "../lang/index.mjs";

import {allignProgram} from "../allign/index.mjs";

import {visitProgram} from "./visit.mjs";

import {createRootScope} from "./scope.mjs";

const makeContext = (pointcut) => ({
  unmangleVariable: (variable) => ({variable}),
  unmangleLabel: (label) => ({label}),
  scope: createRootScope("secret_"),
  global: "global",
  counter: createCounter(0),
  kind: null,
  arrival: null,
  namespace: null,
  pointcut,
});

const test = (context, code1, code2) => {
  assertSuccess(
    allignProgram(visitProgram(context, parseProgram(code1)), code2),
  );
};

const testIdentity = (code) => {
  test(makeContext(false), code, code);
};

/////////////
// Program //
/////////////

// Script (unoptimized) //
test(
  {
    ...makeContext(["arrival"]),
  },
  `
    'script';
    return 'completion';
  `,
  `
    "script";
    let secret_Nnamespace1 = undefined;
    effect(
      intrinsic.aran.setGlobalStrict(
        'secret_Nnamespace1',
        intrinsic.aran.getGlobal('global'),
      ),
    );
    effect(
      intrinsic.aran.get(
        intrinsic.aran.getGlobal("secret_Nnamespace1"),
        "arrival",
      )(
        !intrinsic.aran.getGlobal("secret_Nnamespace1"),
        "script",
        null,
        null,
        "1:0",
      ),
    );
    return 'completion';
  `,
);

// (ScriptProgram optimized) //
testIdentity(`
  'script';
  return 'completion';
`);

// EnclaveEvalProgram //
testIdentity(`
  'external';
  ['this', 'new.target'];
  {
    return 'completion';
  }
`);

// LocalEvalProgram //
testIdentity(`
  'internal';
  let variable1, variable2;
  {
    return variable1;
  }
`);

// GlobalEvalProgram //
testIdentity(`
  'eval';
  {
    return 'completion';
  }
`);

// ModuleProgram //
testIdentity(`
  'module';
  import {specifier1} from 'source';
  export {specifier2};
  export {specifier3 as specifier4} from 'source';
  {
    return 'completion';
  }
`);

///////////
// Block //
///////////

testIdentity(`
  'module';
  {
    label: {
      let variable;
      debugger;
    }
    return 'completion';
  }
`);

test(
  {
    ...makeContext(["break", "read"]),
    global: "global",
    unmangleLabel: (label) => ({LABEL: label}),
    unmangleVariable: (variable) => ({VARIABLE: variable}),
  },
  `
    'module'
    {
      label: {
        let variable;
        break label;
        effect(variable);
      }
      return 'completion';
    }
  `,
  `
    'module';
    {
      let namespace;
      namespace = intrinsic.aran.getGlobal('global');
      label: {
        let _OLD, _LAB, _VAR;
        _LAB = intrinsic.aran.createObject(null, "LABEL", "label");
        _VAR = intrinsic.aran.createObject(null, "VARIABLE", "variable");
        effect(
          intrinsic.aran.get(namespace, "break")(!namespace, _LAB, "6:8"),
        );
        break label;
        effect(
          intrinsic.aran.get(namespace, "read")(!namespace, _VAR, _OLD, "7:15"),
        );
      }
      return 'completion';
    }
  `,
);

test(
  {
    ...makeContext(["leave"]),
    global: "global",
  },
  `
    'module';
    {
      return 'completion';
    }
  `,
  `
    'module';
    {
      let namespace;
      namespace = intrinsic.aran.getGlobal('global');
      try {
        return 'completion';
      } catch {
        return intrinsic.aran.throw(
          intrinsic.aran.get(input, 'error'),
        );
      } finally {
        effect(
          intrinsic.aran.get(namespace, 'leave')(!namespace, '3:4'),
        );
      }
    }
  `,
);

///////////////
// Statement //
///////////////

testIdentity(`'module'; { debugger; return 'completion'; }`);
testIdentity(`'module'; { label: { break label; } return 'completion'; }`);
testIdentity(`'module'; { return 'completion'; }`);
testIdentity(`'module'; { effect(123); return 'completion'; }`);
testIdentity(`{ var variable = 123; }`);

testIdentity(`{ { effect(123); } }`);
testIdentity(`{ while (123) { effect(456); } }`);
testIdentity(`{ if (123) { effect(456); } else { effect(789); } }`);
testIdentity(
  `{ try { effect(123); } catch { effect(456); } finally { effect(789); } }`,
);

////////////
// Effect //
////////////

testIdentity(`{ effect(123); }`);
testIdentity(`{ let variable; variable = 123; }`);
testIdentity(`{ exportStatic("specifier", 123); }`);
testIdentity(`{ (effect(123), effect(456)); }`);
testIdentity(`{ 123 ? effect(456) : effect(789); }`);

////////////////
// Expression //
////////////////

// testBlock(
//   makeContext(["arrival"]),
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

testIdentity(`{ effect(() => { return 'completion'; }); }`);

testIdentity(`{ effect(input); }`);
testIdentity(`{ effect(intrinsic.ReferenceError); }`);
testIdentity(`{ effect(123); }`);
testIdentity(`{ effect(importStatic("source", "specifier")); }`);
testIdentity(`{ let variable; effect(variable); }`);

testIdentity(`{ effect((effect(123), 456)); }`);
testIdentity(`{ effect(123 ? 456 : 789); }`);
testIdentity(`{ effect(await 123); }`);
testIdentity(`{ effect(yieldStraight(123)); }`);
testIdentity(`{ effect(yieldDelegate(123)); }`);
// testIdentity(`{ let variable; effect(eval([variable], 123)); }`);

testIdentity(`{ effect(123(456, 789)); }`);
testIdentity(`{ effect(new 123(456)); }`);
