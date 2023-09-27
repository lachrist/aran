import { assertSuccess } from "../__fixture__.mjs";

import { createCounter } from "../util/index.mjs";

import { parseProgram } from "../lang/index.mjs";

import { allignProgram } from "../allign/index.mjs";

import { createRootScope } from "./scope.mjs";

import { visitProgram } from "./visit.mjs";

const makeContext = (pointcut) => ({
  unmangleVariable: (variable) => ({ variable }),
  unmangleLabel: (label) => ({ label }),
  scope: createRootScope("secret_"),
  advice: "advice",
  counter: createCounter(0),
  kind: null,
  arrival: null,
  namespace: null,
  pointcut,
});

const test = (context, code1, code2) => {
  assertSuccess(
    allignProgram(visitProgram(parseProgram(code1), context), code2),
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
    let [secret_Nnamespace1] = undefined;
    [secret_Nnamespace1] = [advice];
    void intrinsic.aran.get(
      [secret_Nnamespace1],
      "arrival",
    )(
      ![secret_Nnamespace1],
      "script",
      null,
      null,
      "0:16",
    );
    return 'completion';
  `,
);

// (ScriptProgram optimized) //
testIdentity(`
  'script';
  return 'completion';
`);

// EvalProgram //
testIdentity(`
  'eval';
  {
    return 123;
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
    advice: "advice",
    unmangleLabel: (label) => ({ LABEL: label }),
    unmangleVariable: (variable) => ({ VARIABLE: variable }),
  },
  `
    'module'
    {
      label: {
        let variable;
        break label;
        void variable;
      }
      return 'completion';
    }
  `,
  `
    'module';
    {
      let namespace;
      namespace = [advice];
      label: {
        let OLD, LAB, VAR;
        LAB = intrinsic.aran.createObject(null, "LABEL", "label");
        VAR = intrinsic.aran.createObject(null, "VARIABLE", "variable");
        void intrinsic.aran.get(namespace, "break")(!namespace, LAB, "6:8");
        break label;
        void intrinsic.aran.get(namespace, "read")(!namespace, VAR, OLD, "7:13");
      }
      return 'completion';
    }
  `,
);

test(
  {
    ...makeContext(["leave"]),
    advice: "advice",
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
      namespace = [advice];
      try {
        return 'completion';
      } catch {
        return intrinsic.aran.throw(error);
      } finally {
        void intrinsic.aran.get(namespace, 'leave')(!namespace, '3:4');
      }
    }
  `,
);

///////////////
// Statement //
///////////////

testIdentity(`
  'module';
  {
    debugger;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    label: { break label; }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    void 123;
    return 'completion';
  }
`);

testIdentity(`
  'script';
  {
    var [variable] = 123;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    { void 123; }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    while (123) { void 456; }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    if (123) { void 456; } else { void 789; }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    try { void 123; } catch { void 456; } finally { void 789; }
    return 'completion';
  }`);

////////////
// Effect //
////////////

testIdentity(`
  'module';
  {
    void 123;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    let variable;
    variable = 123;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    [variable] = 123;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  export {specifier};
  {
    specifier << 123;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    123 ? void 456 : void 789;
    return 'completion';
  }
`);

////////////////
// Expression //
////////////////

test(
  {
    ...makeContext(
      (name, ...values) => name === "arrival" && values[0] === "arrow",
    ),
    advice: "advice",
  },
  `
    'module';
    {
      return () => {
        return 123;
      };
    }
  `,
  `
    'module';
    {
      let namespace, callee;
      namespace = [advice];
      return (
        callee = () => {
          void intrinsic.aran.get(namespace, "arrival")(
            !namespace,
            "arrow",
            null,
            callee,
            "4:13",
          );
          return 123;
        },
        callee
      );
    }
  `,
);

testIdentity(`
  'module';
  {
    return () => {
      return 'completion';
    };
  }
`);

testIdentity(`
  'eval';
  {
    return this;
  }
`);

testIdentity(`
  'module';
  {
    return intrinsic.ReferenceError;
  }
`);

testIdentity(`
  'module';
  {
    return 123;
  }
`);

testIdentity(`
  'module';
  import {specifier} from "source";
  {
    return "source" >> specifier;
  }
`);

testIdentity(`
  'module';
  {
    let variable;
    return variable;
  }
`);

testIdentity(`
  'module';
  {
    return [variable];
  }
`);

testIdentity(`
  'module';
  {
    return typeof [variable];
  }
`);

testIdentity(`
  'module';
  {
    return (void 123, 456);
  }
`);

testIdentity(`
  'module';
  {
    return 123 ? 456 : 789;
  }
`);

testIdentity(`
  'module';
  {
    return async () => {
      return await 123;
    };
  }
`);

testIdentity(`
  'module';
  {
    return function* () {
      return yield 123;
    };
  }
`);

testIdentity(`
  'module';
  {
    return function* () {
      return yield* 123;
    };
  }
`);

testIdentity(`
  'module';
  {
    return eval(123);
  }
`);

testIdentity(`
  'module';
  {
    return 123(456, 789);
  }
`);

testIdentity(`
  'module';
  {
    return new 123(456);
  }
`);
