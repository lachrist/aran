import { generate } from "astring";
import {
  instrument as instrumentAran,
  generateSetup as generateAranSetup,
} from "../../../lib/index.mjs";
import { parseGlobal, parseLocal } from "./parse.mjs";
import { runInContext } from "node:vm";
import {
  inspectErrorMessage,
  inspectErrorName,
  inspectErrorStack,
} from "../error-serial.mjs";

const {
  Error,
  undefined,
  String,
  Reflect: { defineProperty, getPrototypeOf, setPrototypeOf, ownKeys: listKey },
} = globalThis;

/**
 * @type {import("./membrane").BasicMembrane}
 */
export const DUMMY_BASIC_MEMBRANE = {
  intrinsics: /** @type {any} */ ({}),
  report: (_name, message) => new Error(message),
  instrumentLocalEvalCode: (code, _path, _situ) => code,
};

/**
 * @type {import("./membrane").WeaveMembrane}
 */
export const DUMMY_WEAVE_MEMBRANE = {
  intrinsics: /** @type {any} */ ({}),
  report: (_name, message) => new Error(message),
  instrumentLocalEvalCode: (code, _path, _situ) => code,
  apply: () => undefined,
  construct: () => undefined,
};

/**
 * @type {import("./membrane").PatchMembrane}
 */
export const DUMMY_PATCH_MEMBRANE = {
  intrinsics: /** @type {any} */ ({}),
  report: (_name, message) => new Error(message),
};

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

const SETUP = generate(
  generateAranSetup({
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
 *   context: import("node:vm").Context,
 * ) => import("./membrane").WeaveMembrane}
 */
export const setupAranWeave = (context) => {
  /** @type {import("../../../lib").IntrinsicRecord} */
  const intrinsics = runInContext(SETUP, context);
  const global = intrinsics["aran.global"];
  const {
    eval: evalGlobal,
    Function,
    Reflect: { apply, construct },
  } = global;
  const $262 = /** /** @type {{$262: import("../test262").$262}} */ (
    /** @type {unknown} */ (global)
  ).$262;
  const { instrumentEvalCode } = $262.aran;
  return {
    intrinsics,
    report: $262.aran.report,
    instrumentLocalEvalCode: (code, path, situ) =>
      instrumentEvalCode(code, { path, situ }),
    apply: (callee, self, input) => {
      if (callee === evalGlobal) {
        if (input.length === 0) {
          return undefined;
        } else {
          const arg0 = input[0];
          if (typeof arg0 !== "string") {
            return arg0;
          } else {
            return evalGlobal(instrumentEvalCode(arg0, null));
          }
        }
      } else if (callee === Function) {
        return evalGlobal(instrumentEvalCode(compileFunctionCode(input), null));
      } else {
        return apply(/** @type {Function} */ (callee), self, input);
      }
    },
    construct: (callee, input) => {
      if (callee === Function) {
        evalGlobal(instrumentEvalCode(compileFunctionCode(input), null));
      } else {
        return construct(/** @type {Function} */ (callee), input);
      }
    },
  };
};

/**
 * @type {(
 *   context: import("node:vm").Context,
 * ) => import("./membrane").BasicMembrane}
 */
export const setupAranBasic = setupAranWeave;

/**
 * @type {(
 *   context: import("node:vm").Context,
 * ) => import("./membrane").PatchMembrane}
 */
export const setupAranPatch = (context) => {
  // Setup must be ran before patching because
  // it relies on eval to be the actual eval
  // intrinsic value.
  /** @type {import("../../../lib").IntrinsicRecord} */
  const intrinsics = runInContext(SETUP, context);
  const global = intrinsics["aran.global"];
  const $262 = /** /** @type {{$262: import("../test262").$262}} */ (
    /** @type {unknown} */ (global)
  ).$262;
  const evalGlobal = global.eval;
  const { instrumentEvalCode } = $262.aran;
  const prototype = global.Function.prototype;
  // evalGlobal //
  {
    /** @type {(...args: unknown[]) => unknown} */
    const evalGlobalPatch = (...args) => {
      if (args.length === 0) {
        return undefined;
      } else {
        const arg0 = args[0];
        if (typeof arg0 !== "string") {
          return arg0;
        } else {
          return evalGlobal(instrumentEvalCode(arg0, null));
        }
      }
    };
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
  // Function //
  {
    /* eslint-disable local/no-function, local/no-rest-parameter */
    const FunctionPatch = /** @type {FunctionConstructor} */ (
      function Function(...args) {
        const result = /** @type {Function} */ (
          evalGlobal(instrumentEvalCode(compileFunctionCode(args), null))
        );
        if (
          new.target !== undefined &&
          getPrototypeOf(result) !== new.target.prototype
        ) {
          setPrototypeOf(result, new.target.prototype);
        }
        return result;
      }
    );
    /* eslint-enable local/no-function, local/no-rest-parameter */
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
  return { report: $262.aran.report, intrinsics };
};

/**
 * @type {<X>(
 *   callee: () => X,
 * ) => import("../outcome").Outcome<
 *   X,
 *   import("../error-serial").ErrorSerial
 * >}
 */
const wrap = (callee) => {
  try {
    return { type: "success", data: callee() };
  } catch (error) {
    if (inspectErrorName(error) === "AranSyntaxError") {
      return {
        type: "failure",
        data: {
          name: "SyntaxError",
          message: inspectErrorMessage(error),
          stack: inspectErrorStack(error),
        },
      };
    } else {
      throw error;
    }
  }
};

/**
 * @type {(
 *   source: import("../source").Source,
 *   config: import("./config").Config,
 * ) => import("../stage").InstrumentOutcome}
 */
export const instrument = (
  source,
  {
    selection,
    standard_pointcut,
    flexible_pointcut,
    global_declarative_record,
    initial_state,
  },
) => {
  if (selection === "*" || selection.includes(source.type)) {
    const parse_outcome =
      source.context === null
        ? parseGlobal(source.kind, source.content)
        : parseLocal(source.kind, source.content);
    if (parse_outcome.type === "failure") {
      return parse_outcome;
    }
    /** @type {import("../../../lib").Config} */
    const complete_config = {
      mode: "normal",
      standard_pointcut,
      flexible_pointcut,
      global_declarative_record,
      initial_state,
      global_variable: GLOBAL_VARIABLE,
      intrinsic_variable: INTRINSIC_VARIABLE,
      escape_prefix: ESCAPE_PREFIX,
      advice_variable: ADVICE_VARIABLE,
    };
    const instrument_outcome = wrap(() =>
      instrumentAran(
        {
          kind: source.kind,
          situ:
            source.context === null
              ? { type: "global" }
              : /** @type {{situ: import("../../../lib").DeepLocalSitu}} */ (
                  source.context
                ).situ,
          path:
            source.context === null
              ? ROOT_PATH
              : /** @type {{path: import("../../../lib/path").Path}} */ (
                  source.context
                ).path,
          root: parse_outcome.data,
        },
        complete_config,
      ),
    );
    if (instrument_outcome.type === "failure") {
      return instrument_outcome;
    }
    for (const warning of instrument_outcome.data._aran_warning_array) {
      if (warning.name === "MissingEvalAdvice") {
        return {
          type: "failure",
          data: {
            name: "AranEvalError",
            message: "eval@before is required to support direct eval call",
            stack: null,
          },
        };
      }
    }
    return {
      type: "success",
      data: {
        location: null,
        content: generate(instrument_outcome.data),
      },
    };
  } else {
    return {
      type: "success",
      data: {
        location: null,
        content: source.content,
      },
    };
  }
};
