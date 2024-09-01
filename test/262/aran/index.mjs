import { generate } from "astring";
import { instrument, generateSetup } from "../../../lib/index.mjs";
import { parseGlobal, parseLocal } from "./parse.mjs";
import { hash32 } from "./hash.mjs";
import { runInContext } from "node:vm";
import { AranTypeError } from "../error.mjs";

const {
  undefined,
  String,
  URL,
  Reflect: { defineProperty, getPrototypeOf, setPrototypeOf, ownKeys: listKey },
} = globalThis;

/**
 * @type {<
 *   S extends import("../../../lib").Json,
 *   V extends import("../../../lib").StandardValuation,
 * >(
 *   advice: import("../../../lib").StandardAdvice<S, V>,
 * ) => import("../../../lib").StandardPointcut}
 */
export const toStandardPointcut = /** @type {any} */ (listKey);

const ROOT_PATH = /** @type {import("../../../lib").Path} */ ("$");

const GLOBAL_VARIABLE = /** @type {import("../../../lib").EstreeVariable} */ (
  "globalThis"
);

const ADVICE_VARIABLE = /** @type {import("../../../lib").EstreeVariable} */ (
  "_ARAN_ADVICE_"
);

const INTRINSIC_VARIABLE =
  /** @type {import("../../../lib").EstreeVariable} */ ("_ARAN_INTRINSIC_");

const ESCAPE_PREFIX = /** @type {import("../../../lib").EstreeVariable} */ (
  "_ARAN_ESCAPE_"
);

/**
 * @type {(
 *   config: import(".").PartialAranConfig,
 *   early_syntax_error: "throw" | "embed",
 * ) => import("../../../lib").Config}
 */
const completeConfig = (
  {
    standard_pointcut,
    flexible_pointcut,
    warning,
    initial_state,
    global_declarative_record,
  },
  early_syntax_error,
) => ({
  mode: "normal",
  standard_pointcut,
  flexible_pointcut,
  initial_state,
  warning,
  early_syntax_error,
  global_declarative_record,
  global_variable: GLOBAL_VARIABLE,
  intrinsic_variable: INTRINSIC_VARIABLE,
  escape_prefix: ESCAPE_PREFIX,
  advice_variable: ADVICE_VARIABLE,
});

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
 *   url: URL,
 *   global_declarative_record: "builtin" | "emulate",
 * ) => boolean}
 */
const shouldInstrument = (url, global_declarative_record) => {
  switch (global_declarative_record) {
    case "builtin": {
      return !url.href.includes("/test262/harness/");
    }
    case "emulate": {
      return true;
    }
    default: {
      throw new AranTypeError(global_declarative_record);
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
const instrumentRoot = ({ kind, url, content }, { record, config }) => {
  if (shouldInstrument(url, config.global_declarative_record)) {
    return record({
      kind,
      url,
      content: generate(
        instrument(
          {
            kind,
            situ: { type: "global" },
            path: ROOT_PATH,
            root: /** @type {any} */ (parseGlobal(kind, content)),
          },
          completeConfig(config, "throw"),
        ),
      ),
    });
  } else {
    return { kind, url, content };
  }
};

/**
 * @type {(
 *   call: {
 *     code: string,
 *     path: import("../../../lib").Path,
 *     situ: import("../../../lib").DeepLocalSitu,
 *   },
 *   config: import(".").Config<{}>,
 * ) => string}
 */
const instrumentDeep = ({ code, path, situ }, { record, config }) =>
  getContent(
    record({
      kind: "script",
      url: new URL(`dynamic:///eval-local/${hash32(code).toString(32)}`),
      content: generate(
        instrument(
          {
            kind: "eval",
            situ,
            path,
            root: parseLocal("eval", code),
          },
          completeConfig(config, "embed"),
        ),
      ),
    }),
  );

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
              situ: { type: "global" },
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
                situ: { type: "global" },
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
                situ: { type: "global" },
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
  { record, config, globals: { evalScript, evalGlobal, Function, apply } },
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
  { record, config, globals: { Function, evalGlobal, construct } },
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
 * @type {<
 *   S extends import("../../../lib").Json,
 *   V extends import("../../../lib").StandardValuation,
 * >(
 *   context: import("node:vm").Context,
 *   advice: import("../../../lib").StandardAdvice<
 *     S,
 *     V,
 *   >,
 * ) => void}
 */
export const setupStandardAdvice = (context, advice) => {
  context[ADVICE_VARIABLE] = advice;
};

/**
 * @type {<S extends import("../../../lib").Json, V>(
 *   context: import("node:vm").Context,
 *   advice: import("../../../lib").FlexibleAspect<
 *     S,
 *     V,
 *   >,
 * ) => void}
 */
export const setupFlexibleAspect = (context, aspect) => {
  for (const key of listKey(aspect)) {
    context[/** @type {string} */ (key)] =
      aspect[/** @type {string} */ (key)].advice;
  }
};

/**
 * @type {(
 *   config: import(".").SetupConfig,
 * ) => {
 *  intrinsics: import("../../../lib").IntrinsicRecord,
 *  instrumentDeep: import(".").InstrumentDeep,
 *  instrumentRoot: import(".").InstrumentRoot,
 * }}
 */
export const setupAranBasic = ({
  context,
  record,
  report: _report,
  ...aran_config
}) => {
  const intrinsics = runInContext(SETUP, context);
  /** @type {import(".").BasicConfig} */
  const config = {
    record,
    config: aran_config,
    globals: {},
  };
  return {
    intrinsics,
    instrumentDeep: (code, path, situ) =>
      instrumentDeep({ code, path, situ }, config),
    instrumentRoot: (source) => instrumentRoot(source, config),
  };
};

/**
 * @type {(
 *   config: import(".").SetupConfig,
 * ) => {
 *   intrinsics: import("../../../lib").IntrinsicRecord,
 *   instrumentDeep: import(".").InstrumentDeep,
 *   instrumentRoot: import(".").InstrumentRoot,
 *   apply: (callee: unknown, self: unknown, input: unknown[]) => unknown,
 *   construct: (callee: unknown, input: unknown[]) => unknown,
 * }}
 */
export const setupAranWeave = ({
  context,
  record,
  report: _report,
  ...aran_config
}) => {
  const global = runInContext("this;", context);
  const intrinsics = runInContext(SETUP, context);
  /** @type {import(".").WeaveConfig} */
  const config = {
    record,
    config: aran_config,
    globals: {
      evalScript: global.$262.evalScript,
      evalGlobal: global.eval,
      Function: global.Function,
      apply: global.Reflect.apply,
      construct: global.Reflect.construct,
    },
  };
  return {
    intrinsics,
    instrumentRoot: (source) => instrumentRoot(source, config),
    instrumentDeep: (code, path, situ) =>
      instrumentDeep({ code, path, situ }, config),
    apply: (callee, self, input) =>
      applyMembrane({ callee, self, input }, config),
    construct: (callee, input) => constructMembrane({ callee, input }, config),
  };
};

/* eslint-disable */
const AranPatchError = class extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranPatchError";
  }
};
/* eslint-enable */

/**
 * @type {(
 *   config: import(".").SetupConfig,
 * ) => {
 *   intrinsics: import("../../../lib").IntrinsicRecord,
 *   instrumentRoot: import(".").InstrumentRoot,
 *   instrumentDeep: import(".").InstrumentDeep,
 * }}
 */
export const setupAranPatch = ({ context, report, record, ...aran_config }) => {
  const global = runInContext("this;", context);
  // Setup must be ran before patching because
  // it relies on eval to be the actual eval
  // intrinsic value.
  const intrinsics = runInContext(SETUP, context);
  const evalScript = global.$262.evalScript;
  const evalGlobal = global.eval;
  /** @type {import(".").PatchConfig} */
  const config = {
    record,
    config: aran_config,
    globals: {
      evalScript,
      evalGlobal,
    },
  };
  const prototype = global.Function.prototype;
  // evalGlobal //
  {
    /** @type {(...args: unknown[]) => unknown} */
    const evalGlobalPatch = (...args) => interceptEvalGlobal(args, config);
    setPrototypeOf(evalGlobalPatch, prototype);
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
    global.eval = evalGlobalPatch;
    intrinsics.eval = evalGlobalPatch;
  }
  // evalScript //
  /** @type {(...args: unknown[]) => unknown} */
  global.$262.evalScript = (...args) => interceptEvalScript(args, config);
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
      value: prototype,
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
    setPrototypeOf(FunctionPatch, prototype);
    global.Function = FunctionPatch;
    intrinsics.Function = FunctionPatch;
  }
  // return //
  return {
    intrinsics,
    instrumentRoot: (source) => instrumentRoot(source, config),
    instrumentDeep: (_code, _path, _context) => {
      const error = new AranPatchError(
        "Patch membrane does not support local eval call",
      );
      report(error);
      throw error;
    },
  };
};
