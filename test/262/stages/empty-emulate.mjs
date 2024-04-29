import { generate } from "astring";
import { instrument, setup } from "../../../lib/index.mjs";
import { readFile } from "node:fs/promises";
import {
  CONFIG,
  SETUP_CONFIG,
  HIDDEN,
  compileExpect,
  parseGlobal,
  parseLocal,
  makeNodeBase,
  makeRootBase,
} from "./util/index.mjs";

const { JSON, URL } = globalThis;

/** @type {import("./util/aran").Pointcut} */
const pointcut = ["eval.before", "apply", "construct"];

/**
 * @type {(
 *   args: import("./util/aran").Value[],
 * ) => string}
 */
const compileFunctionCode = (args) => {
  if (args.length === 0) {
    return "(function anonymous(\n) {\n\n});";
  } else {
    return `(function anonymous(\n${args.slice(0, -1).join(",")}\n) {\n${
      args[args.length - 1]
    }\n});`;
  }
};

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("empty-emulate.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  createInstrumenter: ({ record, warning, context }) => {
    let counter = 0;
    /**
     * @type {(
     *   code: string,
     * ) => import("./util/aran").Value}
     */
    const evaluate = (code) => {
      counter += 1;
      const url = new URL(`eval:///global/${counter}`);
      return context[CONFIG.intrinsic_variable].eval(
        record({
          kind: "script",
          url,
          content: generate(
            instrument(parseGlobal(code, makeRootBase(url), "eval"), {
              ...CONFIG,
              pointcut,
              global_declarative_record: "emulate",
              warning,
              early_syntax_error: "embed",
            }),
          ),
        }).content,
      );
    };
    return {
      setup: [generate(setup(SETUP_CONFIG))],
      globals: {
        ...HIDDEN,
        [CONFIG.advice_variable]: {
          __proto__: null,
          value: /** @type {import("./util/aran").Advice} */ ({
            "__proto__": null,
            "eval.before": (content, context, location) => {
              if (typeof content === "string") {
                counter += 1;
                return record({
                  kind: "script",
                  url: new URL(`eval:///local/${counter}`),
                  content: generate(
                    instrument(
                      parseLocal(content, makeNodeBase(location), context),
                      {
                        ...CONFIG,
                        pointcut,
                        global_declarative_record: "emulate",
                        warning,
                        early_syntax_error: "embed",
                      },
                    ),
                  ),
                }).content;
              } else {
                return content;
              }
            },
            "apply": (function_, this_, arguments_, _location) => {
              if (function_ === context[CONFIG.intrinsic_variable].eval) {
                if (arguments_.length === 0) {
                  return context[CONFIG.intrinsic_variable].undefined;
                } else if (typeof arguments_[0] === "string") {
                  return evaluate(arguments_[0]);
                } else {
                  return arguments_[0];
                }
              } else if (
                function_ === context[CONFIG.intrinsic_variable].Function
              ) {
                return evaluate(compileFunctionCode(arguments_));
              } else {
                // Use Reflect.apply from test case's realm
                // Else, it might throw a type error from this realm.
                return context[CONFIG.intrinsic_variable]["Reflect.apply"](
                  /** @type {function} */ (function_),
                  this_,
                  arguments_,
                );
              }
            },
            "construct": (constructor_, arguments_, _location) => {
              if (
                constructor_ === context[CONFIG.intrinsic_variable].Function
              ) {
                return evaluate(compileFunctionCode(arguments_));
              } else {
                // Use Reflect.construct from test case's realm
                // Else, it might throw a type error from this realm.
                return context[CONFIG.intrinsic_variable]["Reflect.construct"](
                  /** @type {function} */ (constructor_),
                  arguments_,
                );
              }
            },
          }),
          writable: false,
          enumerable: false,
          configurable: false,
        },
      },
      instrument: ({ kind, url, content }) =>
        record({
          kind,
          url,
          content: generate(
            instrument(parseGlobal(content, makeRootBase(url), kind), {
              ...CONFIG,
              pointcut,
              global_declarative_record: "emulate",
              warning,
              early_syntax_error: "throw",
            }),
          ),
        }),
    };
  },
};
