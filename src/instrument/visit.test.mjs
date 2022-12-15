import { assertSuccess } from "../__fixture__.mjs";

import { createCounter } from "../util/index.mjs";

import { parseProgram } from "../lang/index.mjs";

import { allignProgram } from "../allign/index.mjs";

import { visitProgram } from "./visit.mjs";

import { createRootScope } from "./scope.mjs";

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
      intrinsic.aran.writeGlobalStrict(
        'secret_Nnamespace1',
        intrinsic.aran.readGlobal('advice'),
      ),
    );
    effect(
      intrinsic.aran.get(
        intrinsic.aran.readGlobal("secret_Nnamespace1"),
        "arrival",
      )(
        !intrinsic.aran.readGlobal("secret_Nnamespace1"),
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

// ExternalLocalEvalProgram //
testIdentity(`
  'external';
  ['this', 'new.target'];
  {
    return 'completion';
  }
`);

// InternalLocalEvalProgram //
testIdentity(`
  'internal-local-eval';
  let variable1, variable2;
  {
    return variable1;
  }
`);

// GlobalEvalProgram //
testIdentity(`
  'global-eval';
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
        effect(variable);
      }
      return 'completion';
    }
  `,
  `
    'module';
    {
      let namespace;
      namespace = intrinsic.aran.readGlobal('advice');
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
      namespace = intrinsic.aran.readGlobal('advice');
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
    effect(123);
    return 'completion';
  }
`);

testIdentity(`
  'script';
  {
    var variable = 123;
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    { effect(123); }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    while (123) { effect(456); }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    if (123) { effect(456); } else { effect(789); }
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    try { effect(123); } catch { effect(456); } finally { effect(789); }
    return 'completion';
  }`);

////////////
// Effect //
////////////

testIdentity(`
  'module';
  {
    effect(123);
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
  export {specifier};
  {
    exportStatic("specifier", 123);
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    (effect(123), effect(456));
    return 'completion';
  }
`);

testIdentity(`
  'module';
  {
    123 ? effect(456) : effect(789);
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
      namespace = intrinsic.aran.readGlobal('advice');
      return (
        callee = () => {
          effect(
            intrinsic.aran.get(namespace, "arrival")(
              !namespace,
              "arrow",
              null,
              callee,
              "4:13",
            ),
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
  'module';
  {
    return input;
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
    return importStatic("source", "specifier");
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
    return (effect(123), 456);
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
      return yieldStraight(123);
    };
  }
`);

testIdentity(`
  'module';
  {
    return function* () {
      return yieldDelegate(123);
    };
  }
`);

test(
  {
    ...makeContext(false),
    unmangleVariable: (variable) => ({ VARIABLE: variable }),
  },
  `
    'module';
    {
      let variable;
      return eval([variable], 123);
    }
  `,
  `
    'module';
    {
      let old_variable, new_variable;
      new_variable = intrinsic.aran.createObject(
        null,
        "VARIABLE",
        "variable",
      );
      return eval([old_variable, new_variable], 123);
    }
  `,
);

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
