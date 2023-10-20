import { Script, SourceTextModule, runInContext } from "node:vm";
import { readFileCache } from "./cache.mjs";
import { createRealm } from "./realm.mjs";
import { inspectErrorName, show } from "./inspect.mjs";
import { compileLinker } from "./linker.mjs";

const { Promise, Error } = globalThis;

/**
 * @type {(
 *   trace: test262.Log[],
 * ) => {
 *   done: Promise<null | string>,
 *   print: (message: unknown) => void,
 * }}
 */
const makeAsynchronousTermination = (trace) => {
  /** @type {(error: null | string) => void} */
  let resolve;
  return {
    done: new Promise((resolve_) => {
      resolve = resolve_;
    }),
    print: (raw) => {
      const message = show(raw);
      trace.push({
        name: "Print",
        message,
      });
      if (message === "Test262:AsyncTestComplete") {
        resolve(null);
      }
      if (message.startsWith("Test262:AsyncTestFailure:")) {
        resolve(message);
      }
    },
  };
};

/**
 * @type {(
 *   trace: test262.Log[],
 * ) => {
 *   done: Promise<null>,
 *   print: (message: string) => void,
 * }}
 */
const makeSynchronousTermination = (trace) => ({
  done: Promise.resolve(null),
  print: (raw) => {
    trace.push({
      name: "Print",
      message: show(raw),
    });
  },
});

/**
 * @type {(
 *   error: unknown,
 *   phase: test262.Phase,
 * ) => void}
 */
const throwError = (error, _phase) => {
  throw error;
};

/**
 * @type {(
 *   options: test262.Case,
 *   trace: test262.Log[],
 *   instrumenter: test262.Instrumenter,
 * ) => Promise<void>}
 */
export const runTestCase = async (
  { url, content, negative, asynchronous, includes, module },
  trace,
  instrumenter,
) => {
  const { done, print } = asynchronous
    ? makeAsynchronousTermination(trace)
    : makeSynchronousTermination(trace);
  const context = { __proto__: null };
  const { instrument } = instrumenter;
  createRealm({
    context,
    origin: url,
    trace,
    print,
    instrumenter,
  });
  let caught = false;
  /**
   * @type {(
   *   error: unknown,
   *   phase: test262.Phase,
   * ) => void}
   */
  const catchNegative =
    negative === null
      ? throwError
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
    origin: url,
    instrument,
  });
  if (module) {
    try {
      /** @type {import("node:vm").Module} */
      const module = new SourceTextModule(
        instrument(content, { kind: "module", specifier: url }),
        {
          identifier: url.href,
          context,
          importModuleDynamically: /** @type {any} */ (link),
        },
      );
      register(module, url);
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
  } else {
    try {
      const script = new Script(
        instrument(content, { kind: "script", specifier: url }),
        {
          filename: url.href,
          importModuleDynamically: /** @type {any} */ (link),
        },
      );
      register(script, url);
      try {
        script.runInContext(context);
      } catch (error) {
        catchNegative(error, "runtime");
      }
    } catch (error) {
      catchNegative(error, "parse");
    }
  }
  await done;
  if (negative !== null && !caught) {
    throw new Error("Missing negative error");
  }
};
