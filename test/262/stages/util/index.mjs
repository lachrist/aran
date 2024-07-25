import { generate } from "astring";
import {
  instrument,
  setup as generateSetup,
  ROOT_PATH,
} from "../../../../lib/index.mjs";
import { parseGlobal, parseLocal } from "./parse.mjs";
import { hash32 } from "./hash.mjs";
import { runInContext } from "node:vm";
import { AranTestError, AranTypeError } from "../../error.mjs";

const {
  undefined,
  String,
  URL,
  Object: { entries: listEntryInner },
  Reflect: { apply, construct, defineProperty, getPrototypeOf, setPrototypeOf },
} = globalThis;

/**
 * @type {<K extends PropertyKey, V>(
 *   record: { [k in K]?: V },
 * ) => [K, V][]}
 */
const listEntry = listEntryInner;

const GLOBAL_VARIABLE =
  /** @type {import("../../../../lib").EstreeVariable} */ ("globalThis");

const INTRINSIC_VARIABLE =
  /** @type {import("../../../../lib").EstreeVariable} */ ("_ARAN_INTRINSIC_");

export const ADVICE_VARIABLE =
  /** @type {import("../../../../lib").EstreeVariable} */ ("_ARAN_ADVICE_");

const ESCAPE_PREFIX = /** @type {import("../../../../lib").EstreeVariable} */ (
  "_ARAN_ESCAPE_"
);

/**
 * @type {(
 *   config: import(".").PartialAranConfig,
 *   early_syntax_error: "throw" | "embed",
 * ) => import("../../../../lib").Config}
 */
const completeConfig = (
  { pointcut, warning, initial, global_declarative_record },
  early_syntax_error,
) => {
  if (pointcut.type === "standard") {
    return {
      mode: "normal",
      weaving: "standard",
      pointcut: pointcut.data,
      initial,
      warning,
      early_syntax_error,
      global_declarative_record,
      global_variable: GLOBAL_VARIABLE,
      intrinsic_variable: INTRINSIC_VARIABLE,
      escape_prefix: ESCAPE_PREFIX,
      advice_variable: ADVICE_VARIABLE,
    };
  } else if (pointcut.type === "flexible") {
    return {
      mode: "normal",
      weaving: "flexible",
      pointcut: pointcut.data,
      initial,
      warning,
      early_syntax_error,
      global_declarative_record,
      global_variable: GLOBAL_VARIABLE,
      intrinsic_variable: INTRINSIC_VARIABLE,
      escape_prefix: ESCAPE_PREFIX,
      advice_variable: ADVICE_VARIABLE,
    };
  } else {
    throw new AranTypeError(pointcut);
  }
};

const SETUP = generate(
  generateSetup({
    global_variable: GLOBAL_VARIABLE,
    intrinsic_variable: INTRINSIC_VARIABLE,
  }),
);

/**
 * @type {(
 *   args: unknown[],
 * ) => string}
 */
const compileFunctionCode = (args) =>
  `(function anonymous(${args.slice(0, -1).map(String).join(",")}\n) {\n${
    args[args.length - 1]
  }\n});`;

/**
 * @type {<X>(
 *   data: {
 *     content: X,
 *   },
 * ) => X}
 */
const getContent = ({ content }) => content;

/**
 * @type {(
 *   args: unknown[],
 * ) => string | null}
 */
const getArgumentCode = (args) => {
  if (args.length === 0) {
    return null;
  } else {
    const arg0 = args[0];
    if (typeof arg0 === "string") {
      return arg0;
    } else {
      return null;
    }
  }
};

/**
 * @type {(
 *   file: {
 *     kind: "script" | "module",
 *     url: URL,
 *     content: string,
 *   },
 *   config: import(".").Config<{}>,
 * ) => {
 *   kind: "script" | "module",
 *   url: URL,
 *   content: string,
 * }}
 */
export const instrumentRoot = ({ kind, url, content }, { record, config }) =>
  record({
    kind,
    url,
    content: generate(
      instrument(
        {
          kind,
          situ: "global",
          path: ROOT_PATH,
          root: /** @type {any} */ (parseGlobal(kind, content)),
          context: {},
        },
        completeConfig(config, "throw"),
      ),
    ),
  });

/**
 * @type {(
 *   call: {
 *     code: unknown,
 *     path: import("../../../../lib").Path,
 *     context: import("../../../../lib").DeepLocalContext,
 *   },
 *   config: import(".").Config<{}>,
 * ) => unknown}
 */
export const instrumentDeep = ({ code, path, context }, { record, config }) => {
  if (typeof code === "string") {
    return getContent(
      record({
        kind: "script",
        url: new URL(`dynamic:///eval-local/${hash32(code).toString(32)}`),
        content: generate(
          instrument(
            {
              kind: "eval",
              situ: "local.deep",
              path,
              root: parseLocal("eval", code),
              context,
            },
            completeConfig(config, "embed"),
          ),
        ),
      }),
    );
  } else {
    return code;
  }
};

/**
 * @type {(
 *   input: unknown[],
 *   config: import(".").Config<{
 *     evalGlobal: (code: string) => unknown,
 *   }>,
 * ) => unknown}
 */
const interceptFunction = (
  input,
  { record, config, globals: { evalGlobal } },
) => {
  const code = compileFunctionCode(input);
  return evalGlobal(
    getContent(
      record({
        kind: "script",
        url: new URL(`dynamic:///function/${hash32(code).toString(32)}`),
        content: generate(
          instrument(
            {
              kind: "eval",
              situ: "global",
              context: {},
              path: ROOT_PATH,
              root: parseGlobal("eval", code),
            },
            completeConfig(config, "embed"),
          ),
        ),
      }),
    ),
  );
};

/**
 * @type {(
 *   input: unknown[],
 *   config: import(".").Config<{
 *     evalScript: (code: string) => unknown,
 *   }>,
 * ) => unknown}
 */
const interceptEvalScript = (
  input,
  { record, config, globals: { evalScript } },
) => {
  const code = getArgumentCode(input);
  if (code === null) {
    return null;
  } else {
    return evalScript(
      getContent(
        record({
          kind: "script",
          url: new URL(`dynamic:///script/${hash32(code).toString(32)}`),
          content: generate(
            instrument(
              {
                kind: "script",
                situ: "global",
                context: {},
                path: ROOT_PATH,
                root: parseGlobal("script", code),
              },
              completeConfig(config, "embed"),
            ),
          ),
        }),
      ),
    );
  }
};

/**
 * @type {(
 *   input: unknown[],
 *   config: import(".").Config<{
 *     evalGlobal: (code: string) => unknown,
 *   }>,
 * ) => unknown}
 */
const interceptEvalGlobal = (
  input,
  { config, record, globals: { evalGlobal } },
) => {
  const code = getArgumentCode(input);
  if (code === null) {
    return input.length > 0 ? input[0] : undefined;
  } else {
    return evalGlobal(
      getContent(
        record({
          kind: "script",
          url: new URL(`dynamic:///eval-global/${hash32(code).toString(32)}`),
          content: generate(
            instrument(
              {
                kind: "eval",
                situ: "global",
                context: {},
                path: ROOT_PATH,
                root: parseGlobal("eval", code),
              },
              completeConfig(config, "embed"),
            ),
          ),
        }),
      ),
    );
  }
};

/**
 * @type {(
 *   call: {
 *     callee: unknown,
 *     self: unknown,
 *     input: unknown[],
 *   },
 *   config: import(".").WeaveConfig,
 * ) => unknown}
 */
const applyMembrane = (
  call,
  { record, config, globals: { evalScript, evalGlobal, Function } },
) => {
  if (call.callee === evalScript) {
    return interceptEvalScript(call.input, {
      record,
      config,
      globals: { evalScript },
    });
  } else if (call.callee === evalGlobal) {
    return interceptEvalGlobal(call.input, {
      record,
      config,
      globals: { evalGlobal },
    });
  } else if (call.callee === Function) {
    return interceptFunction(call.input, {
      record,
      config,
      globals: { evalGlobal },
    });
  } else {
    return apply(/** @type {Function} */ (call.callee), call.self, call.input);
  }
};

/**
 * @type {(
 *   call: {
 *     callee: unknown,
 *     input: unknown[],
 *   },
 *   config: import(".").WeaveConfig,
 * ) => unknown}
 */
const constructMembrane = (
  call,
  { record, config, globals: { Function, evalGlobal } },
) => {
  if (call.callee === Function) {
    return interceptFunction(call.input, {
      record,
      config,
      globals: { evalGlobal },
    });
  } else {
    return construct(/** @type {Function} */ (call.callee), call.input);
  }
};

/**
 * @type {<S extends import("../../../../lib").Json>(
 *   global: object,
 *   aspect: import(".").Aspect<S>,
 * ) => import(".").Pointcut}
 */
const setupAspect = (global, aspect) => {
  switch (aspect.type) {
    case "standard": {
      /**
       * @type {{
       *   [key in import("../../../../lib").StandardKind]?: Function
       * }}
       */
      const advice = {
        // @ts-ignore
        __proto__: null,
      };
      /**
       * @type {{
       *   [key in import("../../../../lib").StandardKind]?: (
       *     | boolean
       *     | Function
       *   )
       * }}
       */
      const pointcut = {
        // @ts-ignore
        __proto__: null,
      };
      for (const [key, val] of listEntry(aspect.data)) {
        if (val != null) {
          if (typeof val === "function") {
            pointcut[key] = /** @type {any} */ (true);
            advice[key] = val;
          } else {
            pointcut[key] = val.pointcut;
            advice[key] = val.advice;
          }
        }
      }
      defineProperty(global, ADVICE_VARIABLE, {
        // @ts-ignore
        __proto__: null,
        value: advice,
        writable: false,
        enumerable: false,
        configurable: false,
      });
      return {
        type: "standard",
        data: /** @type {import("../../../../lib").StandardPointcut} */ (
          pointcut
        ),
      };
    }
    case "flexible": {
      /** @type {import("../../../../lib").FlexiblePointcut} */
      const pointcut = {};
      for (const [key, val] of listEntry(aspect.data)) {
        if (val != null) {
          const { advice, ...item } = val;
          defineProperty(global, key, {
            // @ts-ignore
            __proto__: null,
            value: advice,
            writable: false,
            enumerable: false,
            configurable: false,
          });
          pointcut[key] = item;
        }
      }
      return {
        type: "flexible",
        data: pointcut,
      };
    }
    default: {
      throw new AranTypeError(aspect);
    }
  }
};

/**
 * @type {import(".").SetupAran}
 */
export const setupAranBasic = (
  makeAspect,
  { context, record, warning, global_declarative_record, initial },
) => {
  const intrinsics = runInContext(SETUP, context);
  /* eslint-disable no-use-before-define */
  const pointcut = setupAspect(
    intrinsics["aran.global"],
    makeAspect(intrinsics, {
      instrument: (code, path, context) =>
        instrumentDeep({ code, path, context }, config),
      apply: null,
      construct: null,
    }),
  );
  /* eslint-enable no-use-before-define */
  /** @type {import(".").BasicConfig} */
  const config = {
    record,
    config: {
      pointcut,
      warning,
      global_declarative_record,
      initial,
    },
    globals: {},
  };
  return (source) => instrumentRoot(source, config);
};

/**
 * @type {import(".").SetupAran}
 */
export const setupAranWeave = (
  makeAspect,
  { context, record, warning, global_declarative_record, initial },
) => {
  const intrinsics = runInContext(SETUP, context);
  /* eslint-disable no-use-before-define */
  const pointcut = setupAspect(
    intrinsics["aran.global"],
    makeAspect(intrinsics, {
      instrument: (code, path, context) =>
        instrumentDeep({ code, path, context }, config),
      apply: (callee, self, input) =>
        applyMembrane({ callee, self, input }, config),
      construct: (callee, input) =>
        constructMembrane({ callee, input }, config),
    }),
  );
  /* eslint-enable no-use-before-define */
  /** @type {import(".").WeaveConfig} */
  const config = {
    record,
    config: {
      pointcut,
      warning,
      global_declarative_record,
      initial,
    },
    globals: {
      evalScript: intrinsics["aran.global"].$262.evalScript,
      evalGlobal: intrinsics["aran.global"].eval,
      Function: intrinsics["aran.global"].Function,
    },
  };
  return (source) => instrumentRoot(source, config);
};

/**
 * @type {import(".").SetupAran}
 */
export const setupAranPatch = (
  makeAspect,
  { context, reject, record, warning, global_declarative_record, initial },
) => {
  const intrinsics = runInContext(SETUP, context);
  /* eslint-disable no-use-before-define */
  const pointcut = setupAspect(
    intrinsics["aran.global"],
    makeAspect(intrinsics, {
      instrument: (_code, _path, _context) => {
        reject("local-eval-in-patch-membrane");
        throw new AranTestError(
          "Patch membrane does not support local eval call",
        );
      },
      apply: null,
      construct: null,
    }),
  );
  /* eslint-enable no-use-before-define */
  const function_prototype = intrinsics["aran.global"].Function.prototype;
  /** @type {import(".").PatchConfig} */
  const config = {
    record,
    config: {
      pointcut,
      warning,
      global_declarative_record,
      initial,
    },
    globals: {
      evalScript: intrinsics["aran.global"].$262.evalScript,
      evalGlobal: intrinsics["aran.global"].eval,
    },
  };
  // evalGlobal //
  {
    /** @type {(...args: unknown[]) => unknown} */
    const evalGlobalPatch = (...args) => interceptEvalGlobal(args, config);
    setPrototypeOf(evalGlobalPatch, function_prototype);
    defineProperty(evalGlobalPatch, "length", {
      // @ts-ignore
      __proto__: null,
      value: 1,
      writable: false,
      enumerable: false,
      configurable: true,
    });
    defineProperty(evalGlobalPatch, "name", {
      // @ts-ignore
      __proto__: null,
      value: "eval",
      writable: false,
      enumerable: false,
      configurable: true,
    });
    intrinsics["aran.global"].eval = evalGlobalPatch;
  }
  // evalScript //
  /** @type {(...args: unknown[]) => unknown} */
  intrinsics["aran.global"].$262.evalScript = (...args) =>
    interceptEvalScript(args, config);
  // Function //
  {
    /** @type {(...args: unknown[]) => unknown} */
    // eslint-disable-next-line local/no-function, local/no-rest-parameter
    const FunctionPatch = function Function(...args) {
      const result = /** @type {Function} */ (interceptFunction(args, config));
      if (
        new.target !== undefined &&
        getPrototypeOf(result) !== new.target.prototype
      ) {
        setPrototypeOf(result, new.target.prototype);
      }
      return result;
    };
    defineProperty(FunctionPatch, "prototype", {
      // @ts-ignore
      __proto__: null,
      value: function_prototype,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    defineProperty(FunctionPatch, "length", {
      // @ts-ignore
      __proto__: null,
      value: 1,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    setPrototypeOf(FunctionPatch, function_prototype);
    intrinsics["aran.global"].Function = FunctionPatch;
  }
  // return //
  return (source) => instrumentRoot(source, config);
};

/**
 * @type {<S extends import("../../../../lib").Json>(
 *   type: "basic" | "weave" | "patch",
 *   makeAspect: import(".").MakeAspect<S>,
 *   config: import(".").SetupConfig<S>,
 * ) => import(".").InstrumentRoot}
 */
export const setupAran = (type, makeAspect, config) => {
  switch (type) {
    case "basic": {
      return setupAranBasic(makeAspect, config);
    }
    case "weave": {
      return setupAranWeave(makeAspect, config);
    }
    case "patch": {
      return setupAranPatch(makeAspect, config);
    }
    default: {
      throw new AranTypeError(type);
    }
  }
};
