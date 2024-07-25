import { Script, SourceTextModule, runInContext } from "node:vm";
import { createRealm } from "./realm.mjs";
import { inspectError, inspectErrorName, show } from "./util.mjs";
import { compileLinker } from "./linker.mjs";
import { AranTypeError } from "./error.mjs";
import { fetchHarness } from "./harness.mjs";

const { Promise, Error } = globalThis;

// eslint-disable-next-line local/no-class, local/standard-declaration
class NegativeError extends Error {}

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
      // console.dir(unknown, { depth: null });
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
  print: (_unknown) => {
    // console.dir(_unknown, { depth: null });
  },
};

/**
 * @type {(
 *   phase: "parse" | "resolution" | "runtime",
 *   name: string,
 *   runAsync: () => void,
 * ) => void}
 */
const runNegative = (phase, name, run) => {
  let caught = false;
  try {
    run();
  } catch (error) {
    if (inspectErrorName(error) === name) {
      caught = true;
    } else {
      throw error;
    }
  }
  if (!caught) {
    throw new NegativeError(
      `Missing synchronous ${name} error during ${phase} phase`,
    );
  }
};

/**
 * @type {(
 *   phase: "parse" | "resolution" | "runtime",
 *   name: string,
 *   runAsync: () => Promise<void>,
 * ) => Promise<void>}
 */
const runNegativeAsync = async (phase, name, runAsync) => {
  let caught = false;
  try {
    await runAsync();
  } catch (error) {
    if (inspectErrorName(error) === name) {
      caught = true;
    } else {
      throw error;
    }
  }
  if (!caught) {
    throw new NegativeError(
      `Missing asynchronous ${name} error during ${phase} phase`,
    );
  }
};

/**
 * @type {(
 *   options: {
 *     case: import("./types").Case,
 *     compileInstrument: import("./types").CompileInstrument,
 *     warning: "ignore" | "console",
 *     reject: (reason: string) => void,
 *     record: import("./types").Instrument,
 *   },
 * ) => Promise<void>}
 */
export const runTestCaseInner = async ({
  case: { source: source1, negative, asynchronous, includes },
  compileInstrument,
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
    compileInstrument,
  });
  const { instrument } = context.$262;
  for (const url of includes) {
    const source = await fetchHarness(instrument, url);
    runInContext(source.content, context, {
      filename: source.url.href,
    });
  }
  const { link, importModuleDynamically, register } = compileLinker({
    context,
    instrument,
  });
  let source2 = source1;
  if (negative !== null && negative.phase === "parse") {
    try {
      source2 = instrument(source1);
    } catch {
      source2 = source1;
    }
  } else {
    source2 = instrument(source1);
  }
  if (source2.kind === "module") {
    if (negative !== null && negative.phase === "parse") {
      runNegative(
        "parse",
        negative.type,
        () =>
          new SourceTextModule(source2.content, {
            identifier: source2.url.href,
            context,
            // eslint-disable-next-line object-shorthand
            importModuleDynamically: /** @type {any} */ (
              importModuleDynamically
            ),
          }),
      );
    } else {
      const module = new SourceTextModule(source2.content, {
        identifier: source2.url.href,
        context,
        // eslint-disable-next-line object-shorthand
        importModuleDynamically: /** @type {any} */ (importModuleDynamically),
      });
      register(module, source1.url);
      if (negative !== null && negative.phase === "resolution") {
        runNegativeAsync("resolution", negative.type, () => module.link(link));
      } else {
        await module.link(link);
        if (negative !== null && negative.phase === "runtime") {
          runNegativeAsync("runtime", negative.type, () => module.evaluate());
        } else {
          await module.evaluate();
        }
      }
    }
  } else if (source2.kind === "script") {
    if (negative !== null && negative.phase === "parse") {
      runNegative(
        "parse",
        negative.type,
        () =>
          new Script(source2.content, {
            filename: source2.url.href,
            // eslint-disable-next-line object-shorthand
            importModuleDynamically: /** @type {any} */ (
              importModuleDynamically
            ),
          }),
      );
    } else {
      const script = new Script(source2.content, {
        filename: source2.url.href,
        // eslint-disable-next-line object-shorthand
        importModuleDynamically: /** @type {any} */ (importModuleDynamically),
      });
      register(script, source1.url);
      if (negative !== null && negative.phase === "runtime") {
        runNegative("runtime", negative.type, () =>
          script.runInContext(context),
        );
      } else {
        script.runInContext(context);
      }
    }
  } else {
    throw new AranTypeError(source2.kind);
  }
  await done;
};

/**
 * @type {(
 *   options: {
 *     case: import("./types").Case,
 *     warning: "ignore" | "console",
 *     record: import("./types").Instrument,
 *     compileInstrument: import("./types").CompileInstrument,
 *   },
 * ) => Promise<import("./types").Outcome>}
 */
export const runTestCase = async (options) => {
  /** @type {string[]} */
  const reasons = [];
  try {
    await runTestCaseInner({
      ...options,
      reject: (reason) => {
        reasons[reasons.length] = reason;
      },
    });
  } catch (error) {
    if (reasons.length > 0) {
      return { type: "failure-meta", data: reasons };
    } else {
      return { type: "failure-base", data: inspectError(error) };
    }
  }
  if (reasons.length > 0) {
    return { type: "failure-meta", data: reasons };
  } else {
    return { type: "success", data: null };
  }
};
