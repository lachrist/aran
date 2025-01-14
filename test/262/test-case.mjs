import { Script, SourceTextModule, runInContext } from "node:vm";
import { createRealm } from "./realm.mjs";
import { show } from "./util.mjs";
import { compileLinker } from "./linker.mjs";
import { AranNegativeError, AranTypeError } from "./error.mjs";
import { serializeError } from "./error-serial.mjs";
import { cpuUsage } from "node:process";

const { Promise } = globalThis;

/**
 * @type {() => import("./test-case").Termination}
 */
const makeAsynchronousTermination = () => {
  /** @type {(error: null | import("./error-serial").ErrorSerial) => void} */
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
        resolve({
          name: "AsyncTest262Error",
          message: message.slice("Test262:AsyncTestFailure:".length),
          stack: null,
        });
      }
    },
  };
};

/** @type {import("./test-case").Termination} */
const termination = {
  done: Promise.resolve(null),
  print: (_unknown) => {
    // console.dir(_unknown, { depth: null });
  },
};

/**
 * @type {<X>(
 *   callback: () => X
 * ) => import("./outcome").Outcome<
 *   X,
 *   import("./error-serial").ErrorSerial,
 * >}
 */
export const wrapOutcome = (callback) => {
  try {
    return { type: "success", data: callback() };
  } catch (error) {
    return {
      type: "failure",
      data: serializeError(error),
    };
  }
};

/**
 * @type {<X>(
 *   callback: () => X
 * ) => Promise<
 *   import("./outcome").Outcome<
 *     X,
 *     import("./error-serial").ErrorSerial,
 *   >
 * >}
 */
export const wrapOutcomeAsync = async (callback) => {
  try {
    return { type: "success", data: await callback() };
  } catch (error) {
    return {
      type: "failure",
      data: serializeError(error),
    };
  }
};

/**
 * @type {<X>(
 *   phase: "instrument" | "parse" | "resolution" | "runtime",
 *   outcome: import("./outcome").Outcome<
 *     X,
 *     import("./error-serial").ErrorSerial,
 *   >,
 *   negative: null | import("./test262").Negative,
 * ) => "negative-success" | import("./outcome").Outcome<
 *   X,
 *   import("./error-serial").ErrorSerial,
 * >}
 */
const applyNegative = (phase, outcome, negative) => {
  switch (outcome.type) {
    case "success": {
      if (negative !== null && negative.phase === phase) {
        return {
          type: "failure",
          data: {
            name: "NegativeTest262Error",
            message: `missing an error named ${negative.type} during ${phase} phase`,
            stack: null,
          },
        };
      } else {
        return outcome;
      }
    }
    case "failure": {
      if (
        negative !== null &&
        negative.phase === (phase === "instrument" ? "parse" : phase)
      ) {
        return "negative-success";
      } else {
        return outcome;
      }
    }
    default: {
      throw new AranTypeError(outcome);
    }
  }
};

/**
 * @type {(
 *   test_case: import("./test-case").TestCase,
 *   dependencies: {
 *     setup: (context: import("node:vm").Context) => void,
 *     signalNegative: (cause: string) => Error,
 *     instrument: import("./stage").Instrument,
 *     resolveDependency: import("./fetch").ResolveDependency,
 *     fetchHarness: import("./fetch").FetchHarness,
 *     fetchTarget: import("./fetch").FetchTarget,
 *   },
 * ) => Promise<null | import("./error-serial").ErrorSerial>}
 */
export const runTestCaseInner = async (
  { source, negative, asynchronous, includes },
  {
    setup,
    signalNegative,
    instrument,
    resolveDependency,
    fetchHarness,
    fetchTarget,
  },
) => {
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : termination;
  const { context } = createRealm({ setup, print, signalNegative }).aran;
  for (const name of includes) {
    try {
      const { path, content } = instrument({
        type: "harness",
        kind: "script",
        path: name,
        content: await fetchHarness(name),
      });
      runInContext(content, context, { filename: path });
    } catch (error) {
      return serializeError(error);
    }
  }
  const { link, importModuleDynamically, registerMain } = compileLinker(
    context,
    { resolveDependency, instrument, fetchTarget },
  );
  const instrument_outcome = applyNegative(
    "instrument",
    wrapOutcome(() => instrument(source)),
    negative,
  );
  if (instrument_outcome === "negative-success") {
    return null;
  }
  if (instrument_outcome.type === "failure") {
    return instrument_outcome.data;
  }
  const { path, content } = instrument_outcome.data;
  if (source.kind === "module") {
    const create_outcome = applyNegative(
      "parse",
      wrapOutcome(
        () =>
          new SourceTextModule(content, {
            identifier: path,
            context,
            // eslint-disable-next-line object-shorthand
            importModuleDynamically: /** @type {any} */ (
              importModuleDynamically
            ),
          }),
      ),
      negative,
    );
    if (create_outcome === "negative-success") {
      return null;
    }
    if (create_outcome.type === "failure") {
      return create_outcome.data;
    }
    const module = create_outcome.data;
    registerMain(module, source.path);
    const link_outcome = applyNegative(
      "resolution",
      await wrapOutcomeAsync(() => module.link(link)),
      negative,
    );
    if (link_outcome === "negative-success") {
      return null;
    }
    if (link_outcome.type === "failure") {
      return link_outcome.data;
    }
    const evaluate_outcome = applyNegative(
      "runtime",
      await wrapOutcomeAsync(() => module.evaluate()),
      negative,
    );
    if (evaluate_outcome === "negative-success") {
      return null;
    }
    if (evaluate_outcome.type === "failure") {
      return evaluate_outcome.data;
    }
    return await done;
  } else if (source.kind === "script") {
    const create_outcome = applyNegative(
      "parse",
      wrapOutcome(
        () =>
          new Script(content, {
            filename: path,
            // eslint-disable-next-line object-shorthand
            importModuleDynamically: /** @type {any} */ (
              importModuleDynamically
            ),
          }),
      ),
      negative,
    );
    if (create_outcome === "negative-success") {
      return null;
    }
    if (create_outcome.type === "failure") {
      return create_outcome.data;
    }
    const script = create_outcome.data;
    registerMain(script, source.path);
    const evaluate_outcome = applyNegative(
      "runtime",
      wrapOutcome(() => script.runInContext(context)),
      negative,
    );
    if (evaluate_outcome === "negative-success") {
      return null;
    }
    if (evaluate_outcome.type === "failure") {
      return evaluate_outcome.data;
    }
    return await done;
  } else {
    throw new AranTypeError(source.kind);
  }
};

/**
 * @type {(
 *   test_case: import("./test-case").TestCase,
 *   dependencies: {
 *     resolveDependency: import("./fetch").ResolveDependency,
 *     fetchHarness: import("./fetch").FetchHarness,
 *     fetchTarget: import("./fetch").FetchTarget,
 *     setup: (context: import("node:vm").Context) => void,
 *     instrument: import("./stage").Instrument,
 *   },
 * ) => Promise<{
 *   expect: string[],
 *   actual: null | import("./error-serial").ErrorSerial,
 *   time: { user: number, system: number },
 * }>}
 */
export const runTestCase = async (test_case, dependencies) => {
  /** @type {string[]} */
  const expect = [];
  const time = cpuUsage();
  const error = await runTestCaseInner(test_case, {
    ...dependencies,
    signalNegative: (cause) => {
      expect.push(cause);
      return new AranNegativeError(cause);
    },
  });
  return { expect, actual: error, time: cpuUsage(time) };
};
