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

const global_variable = /** @type {estree.Variable} */ ("globalThis");

const intrinsic_variable = /** @type {estree.Variable} */ ("_ARAN_INTRINSIC_");

const advice_variable = /** @type {estree.Variable} */ ("_ARAN_ADVICE_");

const log_variable = /** @type {estree.Variable} */ ("_ARAN_LOG_");

const escape_prefix = /** @type {estree.Variable} */ ("_ARAN_ESCAPE_");

/**
 * @type {(
 *   url: URL,
 * ) => import("./aran").Base}
 */
const makeBase = (url) => /** @type {import("./aran").Base} */ (url.href);

const listKey = /** @type {<O extends object>(record: O) => (keyof O)[]} */ (
  ownKeys
);

/**
 * @type {import("./aran").Locate}
 */
const locate = (path, base) =>
  /** @type {import("./aran").Location} */ (`${base}#${path}`);

/** @type {(value: unknown) => void} */
const log = (value) => {
  dir(value, { showHidden: true });
};

const setup = generate(compileSetup({ global_variable, intrinsic_variable }));

/**
 * @type {(
 *   makeAdvice: (options: {
 *     reject: (error: Error) => void,
 *     intrinsic: import("../../../../type/aran").IntrinsicRecord,
 *     instrument: (
 *       code: string,
 *       situ: import("./situ").Situ,
 *       location: null | import("./aran").Location,
 *     ) => string,
 *   }) => import("./aran").Advice,
 *   options: {
 *     global_declarative_record: "emulate" | "native",
 *   },
 * ) => test262.CompileInstrument}
 */
export const compileCompileAranInstrument =
  (makeAdvice, { global_declarative_record }) =>
  ({ reject, record, warning, context }) => {
    let counter = 0;
    const intrinsic =
      /** @type {import("../../../../type/aran").IntrinsicRecord} */ (
        runInContext(setup, context)
      );
    /** @type {import("./aran").Advice} */
    const advice = makeAdvice({
      reject,
      intrinsic,
      instrument: (code, situ, location) => {
        counter += 1;
        const url = new URL(
          `dynamic:///${situ.kind}/${counter}${
            location === null ? "" : `#${encodeURIComponent(location)}`
          }`,
        );
        const { content } = record({
          kind: "script",
          url,
          content: generate(
            instrument(
              parse(code, makeBase(url), situ),
              // eslint-disable-next-line no-use-before-define
              embed_config,
            ),
          ),
        });
        return content;
      },
    });
    const pointcut = listKey(advice);
    const config = {
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
              parse(content, makeBase(url), { kind, context: null }),
              throw_config,
            ),
          ),
        });
      }
    };
  };
