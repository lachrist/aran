import { generate } from "astring";
import {
  instrument,
  setup as compileSetup,
  extractStandardPointcut,
  extractStandardAdvice,
  ROOT_PATH,
} from "../../../../lib/index.mjs";
import { parse } from "./parse.mjs";
import { runInContext } from "node:vm";

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

/** @type {(value: unknown) => void} */
const log = (value) => {
  dir(value, { showHidden: true });
};

const setup = generate(compileSetup({ global_variable, intrinsic_variable }));

/**
 * @type {<X, V extends import("../../../../lib").Valuation>(
 *  aspect: {
 *    config: import("../../../../lib").Config,
 *    advice: [import("../../../../lib").EstreeVariable, unknown][],
 *   },
 *   options: {
 *     record: import("../../types").Instrument,
 *     context: import("vm").Context,
 *   },
 * ) => import("./aran").Instrumentation}
 */
const common = ({ config, advice }, { record, context }) => {
  let counter = 0;
  const intrinsic =
    /** @type {import("../../../../lib/lang").IntrinsicRecord} */ (
      runInContext(setup, context)
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
  return {
    intrinsic,
    instrumentRoot: ({ kind, url, content }) => {
      if (
        config.global_declarative_record === "native" &&
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
                path: ROOT_PATH,
                context: {},
              }),
              throw_config,
            ),
          ),
        });
      }
    },
    instrumentDeep: (code, context, path) => {
      counter += 1;
      const url = new URL(
        `dynamic:///eval/${counter}${
          path === null ? "" : `#${encodeURIComponent(path)}`
        }`,
      );
      const { content } = record({
        kind: "script",
        url,
        content: generate(
          instrument(
            parse(
              context === null
                ? {
                    kind: "eval",
                    situ: "global",
                    code,
                    path: path ?? ROOT_PATH,
                    context: {},
                  }
                : {
                    kind: "eval",
                    situ: "local.deep",
                    code,
                    path: path ?? ROOT_PATH,
                    context,
                  },
            ),
            // eslint-disable-next-line no-use-before-define
            embed_config,
          ),
        ),
      });
      return content;
    },
  };
};

/**
 * @type {<X, V extends import("../../../../lib").Valuation>(
 *   aspect: import("../../../../lib").StandardAspect<X, V>,
 *   options: {
 *     record: import("../../types").Instrument,
 *     context: import("vm").Context,
 *     warning: "console" | "ignore",
 *     global_declarative_record: "emulate" | "native",
 *   },
 * ) => import("./aran").Instrumentation}
 */
export const compileStandardInstrumentation = (
  aspect,
  { warning, global_declarative_record, record, context },
) =>
  common(
    {
      config: {
        mode: "normal",
        weave: "standard",
        initial: null,
        pointcut: extractStandardPointcut(aspect),
        early_syntax_error: "embed",
        global_variable,
        advice_variable,
        intrinsic_variable,
        escape_prefix,
        global_declarative_record,
        warning,
      },
      advice: [[advice_variable, extractStandardAdvice(aspect)]],
    },
    { record, context },
  );
