import { Script, SourceTextModule, runInContext } from "node:vm";
import { readFileCache } from "./cache.mjs";
import { createRealm } from "./realm.mjs";
import { inspectErrorName, show } from "./util.mjs";
import { compileLinker } from "./linker.mjs";

const { Promise, Error } = globalThis;

// eslint-disable-next-line local/no-class, local/standard-declaration
class NegativeAranError extends Error {}

/**
 * @typedef {{
 *   done: Promise<null | string>,
 *   print: (message: unknown) => void,
 * }} Termination
 */

/**
 * @type {() => Termination}
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

/** @type {Termination} */
const termination = {
  done: Promise.resolve(null),
  print: (_unknown) => {},
};

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
 *   instrumenter: test262.Instrumenter,
 * ) => Promise<void>}
 */
export const runTestCase = async (
  { url, content, negative, asynchronous, includes, module },
  instrumenter,
) => {
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : termination;
  const context = { __proto__: null };
  const { instrument } = instrumenter;
  createRealm({
    context,
    origin: url,
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
    throw new NegativeAranError("Missing negative error");
  }
};
