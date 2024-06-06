import { generate } from "astring";
import {
  instrument,
  setup as compileSetup,
  extractStandardPointcut,
  extractFlexiblePointcut,
  extractStandardAdvice,
  extractFlexibleAdvice,
} from "../../../../lib/index.mjs";
import { parse } from "./parse.mjs";
import { runInContext } from "node:vm";
import { AranTypeError } from "../../error.mjs";

const {
  encodeURIComponent,
  URL,
  console: { dir },
  Reflect: { defineProperty },
} = globalThis;

const global_variable =
  /** @type {import("../../../../lib").EstreeVariable} */ ("globalThis");

const intrinsic_variable =
  /** @type {import("../../../../lib").EstreeVariable} */ ("_ARAN_INTRINSIC_");

const advice_variable =
  /** @type {import("../../../../lib").EstreeVariable} */ ("_ARAN_ADVICE_");

const log_variable = /** @type {import("../../../../lib").EstreeVariable} */ (
  "_ARAN_LOG_"
);

const escape_prefix = /** @type {import("../../../../lib").EstreeVariable} */ (
  "_ARAN_ESCAPE_"
);

/**
 * @type {(
 *   url: URL,
 * ) => import("./aran").Base}
 */
const makeBase = (url) => /** @type {import("./aran").Base} */ (url.href);

/** @type {(value: unknown) => void} */
const log = (value) => {
  dir(value, { showHidden: true });
};

const setup = generate(compileSetup({ global_variable, intrinsic_variable }));

/**
 * @type {(
 *   aspect: import("./aspect").Aspect,
 *   options: {
 *     warning: "console" | "ignore",
 *     global_declarative_record: "emulate" | "native",
 *   },
 * ) => {
 *   config: import("../../../../lib").Config
 *   advice: [import("../../../../lib").EstreeVariable, unknown][],
 * }}
 */
const prepare = (aspect, { warning, global_declarative_record }) => {
  switch (aspect.type) {
    case "standard": {
      return {
        config: {
          mode: "normal",
          weave: "standard",
          pointcut: extractStandardPointcut(aspect.data),
          early_syntax_error: "embed",
          global_variable,
          advice_variable,
          intrinsic_variable,
          escape_prefix,
          global_declarative_record,
          warning,
        },
        advice: [[advice_variable, extractStandardAdvice(aspect.data)]],
      };
    }
    case "flexible": {
      return {
        config: {
          mode: "normal",
          weave: "flexible",
          pointcut: extractFlexiblePointcut(aspect.data),
          early_syntax_error: "embed",
          global_variable,
          intrinsic_variable,
          escape_prefix,
          global_declarative_record,
          warning,
        },
        advice: extractFlexibleAdvice(aspect.data),
      };
    }
    default: {
      throw new AranTypeError(aspect);
    }
  }
};

/**
 * @type {(
 *   makeAspect: (
 *     options: {
 *       reject: (error: Error) => void,
 *       intrinsic: import("../../../../lib/lang").IntrinsicRecord,
 *       instrument: (
 *         code: string,
 *         context: null |  import("../../../../lib/program").DeepLocalContext,
 *         location: null | import("./aran").Location,
 *       ) => string,
 *     },
 *   ) => import("./aspect").Aspect,
 *   options: {
 *     global_declarative_record: "emulate" | "native",
 *   },
 * ) => test262.CompileInstrument}
 */
export const compileCompileAranInstrument =
  (makeAspect, { global_declarative_record }) =>
  ({ reject, record, warning, context }) => {
    let counter = 0;
    const intrinsic =
      /** @type {import("../../../../lib/lang").IntrinsicRecord} */ (
        runInContext(setup, context)
      );
    const { config, advice } = prepare(
      makeAspect({
        reject,
        intrinsic,
        instrument: (code, context, location) => {
          counter += 1;
          const url = new URL(
            `dynamic:///eval/${counter}${
              location === null ? "" : `#${encodeURIComponent(location)}`
            }`,
          );
          const base = makeBase(url);
          const { content } = record({
            kind: "script",
            url,
            content: generate(
              instrument(
                parse(
                  context === null
                    ? { kind: "eval", situ: "global", code, base, context: {} }
                    : { kind: "eval", situ: "local.deep", code, base, context },
                ),
                // eslint-disable-next-line no-use-before-define
                embed_config,
              ),
            ),
          });
          return content;
        },
      }),
      {
        warning,
        global_declarative_record,
      },
    );
    /** @type {import("../../../../lib").Config} */
    const embed_config = { ...config, early_syntax_error: "embed" };
    /** @type {import("../../../../lib").Config} */
    const throw_config = { ...config, early_syntax_error: "throw" };
    defineProperty(intrinsic["aran.global"], log_variable, {
      // @ts-ignore
      __proto__: null,
      value: log,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    for (const [key, val] of advice) {
      defineProperty(intrinsic["aran.global"], key, {
        // @ts-ignore
        __proto__: null,
        value: val,
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }
    return ({ kind, url, content }) => {
      if (
        global_declarative_record === "native" &&
        url.href.includes("/test262/harness/")
      ) {
        return { kind, url, content };
      } else {
        return record({
          kind,
          url,
          content: generate(
            instrument(
              parse({
                kind,
                situ: "global",
                code: content,
                base: makeBase(url),
                context: {},
              }),
              throw_config,
            ),
          ),
        });
      }
    };
  };
