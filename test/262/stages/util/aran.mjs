import { generate } from "astring";
import { instrument, setup as compileSetup } from "../../../../lib/index.mjs";
import { parse } from "./parse.mjs";
import { runInContext } from "node:vm";

const {
  encodeURIComponent,
  URL,
  console: { dir },
  Reflect: { ownKeys, defineProperty },
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

const listKey = /** @type {<O extends object>(record: O) => (keyof O)[]} */ (
  ownKeys
);

/** @type {(value: unknown) => void} */
const log = (value) => {
  dir(value, { showHidden: true });
};

const setup = generate(compileSetup({ global_variable, intrinsic_variable }));

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
    const aspect = makeAspect({
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
    });
    const config = {
      mode: /** @type {"normal"} */ ("normal"),
      pointcut,
      locate,
      global_variable,
      advice_variable,
      intrinsic_variable,
      escape_prefix,
      global_declarative_record,
      warning,
    };
    /** @type {import("./aran").Config} */
    const embed_config = { ...config, early_syntax_error: "embed" };
    /** @type {import("./aran").Config} */
    const throw_config = { ...config, early_syntax_error: "throw" };
    defineProperty(intrinsic["aran.global"], log_variable, {
      // @ts-ignore
      __proto__: null,
      value: log,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    defineProperty(intrinsic["aran.global"], advice_variable, {
      // @ts-ignore
      __proto__: null,
      value: advice,
      writable: false,
      enumerable: false,
      configurable: false,
    });
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
