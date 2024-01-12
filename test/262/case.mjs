import { Script, SourceTextModule, runInContext } from "node:vm";
import { readFileCache } from "./cache.mjs";
import { createRealm } from "./realm.mjs";
import { inspectErrorName, show } from "./util.mjs";
import { compileLinker } from "./linker.mjs";
import { AranTypeError } from "./error.mjs";

const { Promise, Error } = globalThis;

// eslint-disable-next-line local/no-class, local/standard-declaration
class NegativeAranError extends Error {}

/**
 * @type {() => import("./case.d.ts").Termination}
 */
const makeAsynchronousTermination = () => {
  /** @type {(error: null | string) => void} */
  let resolve;
  return {
    done: new Promise((resolve_) => {
      resolve = resolve_;
    }),
    print: (unknown) => {
      const message = show(unknown);
      if (message === "Test262:AsyncTestComplete") {
        resolve(null);
      }
      if (message.startsWith("Test262:AsyncTestFailure:")) {
        resolve(message);
      }
    },
  };
};

/** @type {import("./case.d.ts").Termination} */
const termination = {
  done: Promise.resolve(null),
  print: (_unknown) => {},
};

/**
 * @type {(
 *   options: {
 *     case: test262.Case,
 *     createInstrumenter: test262.Stage["createInstrumenter"],
 *     warning: "silent" | "console",
 *     reject: (error: Error) => void,
 *     record: import("./types").Instrument,
 *   },
 * ) => Promise<void>}
 */
export const runTestCaseInner = async ({
  case: { source: source1, negative, asynchronous, includes },
  createInstrumenter,
  warning,
  reject,
  record,
}) => {
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : termination;
  const context = createRealm({
    counter: { value: 0 },
    reject,
    record,
    warning,
    print,
    createInstrumenter,
  });
  const { instrument } = context.$262;
  let caught = false;
  /**
   * @type {(
   *   error: unknown,
   *   phase: test262.Phase,
   * ) => void}
   */
  const catchNegative =
    negative === null
      ? (error, _phase) => {
          throw error;
        }
      : (error, phase) => {
          if (
            negative.phase !== phase ||
            negative.name !== inspectErrorName(error)
          ) {
            throw error;
          } else {
            caught = true;
          }
        };
  for (const url of includes) {
    runInContext(await readFileCache(url), context, {
      filename: url.href,
    });
  }
  const { link, register } = compileLinker({
    context,
    instrument,
  });
  let source2 = source1;
  try {
    source2 = instrument(source1);
  } catch (error) {
    catchNegative(error, "parse");
  }
  if (source2.kind === "module") {
    try {
      /** @type {import("node:vm").Module} */
      const module = new SourceTextModule(source2.content, {
        identifier: source2.url.href,
        context,
        importModuleDynamically: /** @type {any} */ (link),
      });
      register(module, source1.url);
      try {
        await module.link(link);
        try {
          await module.evaluate();
        } catch (error) {
          catchNegative(error, "runtime");
        }
      } catch (error) {
        catchNegative(error, "resolution");
      }
    } catch (error) {
      catchNegative(error, "parse");
    }
  } else if (source2.kind === "script") {
    try {
      const script = new Script(source2.content, {
        filename: source2.url.href,
        importModuleDynamically: /** @type {any} */ (link),
      });
      register(script, source1.url);
      try {
        script.runInContext(context);
      } catch (error) {
        catchNegative(error, "runtime");
      }
    } catch (error) {
      catchNegative(error, "parse");
    }
  } else {
    throw new AranTypeError("invalid source kind", source2.kind);
  }
  await done;
  if (negative !== null && !caught) {
    throw new NegativeAranError("Missing negative error");
  }
};

/**
 * @type {(
 *   options: {
 *     case: test262.Case,
 *     warning: "silent" | "console",
 *     record: import("./types").Instrument,
 *     createInstrumenter: test262.Stage["createInstrumenter"],
 *   },
 * ) => Promise<void>}
 */
export const runTestCase = async (options) => {
  /** @type {Error | null} */
  let meta_error = null;
  try {
    await runTestCaseInner({
      ...options,
      reject: (error) => {
        if (meta_error === null) {
          meta_error = error;
        }
      },
    });
  } catch (error) {
    throw meta_error ?? error;
  }
  if (meta_error !== null) {
    throw meta_error;
  }
};
