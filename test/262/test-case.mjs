import { Script, SourceTextModule, runInContext } from "node:vm";
import { createRealm } from "./realm.mjs";
import { show } from "./util.mjs";
import { compileLinker } from "./linker.mjs";
import { AranTypeError } from "./error.mjs";
import { serializeError } from "./error-serial.mjs";

const { Promise, Error } = globalThis;

/**
 * @type {import("./test-case").TestCaseOutcome}
 */
const SUCCESS = { type: "success", data: null };

/**
 * @type {() => import("./test-case").Termination}
 */
const makeAsynchronousTermination = () => {
  /** @type {(outcome: import("./test-case").TestCaseOutcome) => void} */
  let resolve;
  return {
    done: new Promise((resolve_) => {
      resolve = resolve_;
    }),
    print: (unknown) => {
      // console.dir(unknown, { depth: null });
      const message = show(unknown);
      if (message === "Test262:AsyncTestComplete") {
        resolve(SUCCESS);
      }
      if (message.startsWith("Test262:AsyncTestFailure:")) {
        resolve({
          type: "failure",
          data: {
            name: "AsyncTest262Error",
            message: message.slice("Test262:AsyncTestFailure:".length),
          },
        });
      }
    },
  };
};

/** @type {import("./test-case").Termination} */
const termination = {
  done: Promise.resolve(SUCCESS),
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
 *     report: import("./report").Report,
 *     instrument: import("./stage").Instrument,
 *     resolveDependency: import("./fetch").ResolveDependency,
 *     fetchHarness: import("./fetch").FetchHarness,
 *     fetchTarget: import("./fetch").FetchTarget,
 *   },
 * ) => Promise<import("./test-case").TestCaseOutcome>}
 */
export const runTestCaseInner = async (
  { source, negative, asynchronous, includes },
  { setup, report, instrument, resolveDependency, fetchHarness, fetchTarget },
) => {
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : termination;
  const context = createRealm({
    setup,
    print,
    report,
    instrument,
  });
  for (const name of includes) {
    const harness_outcome = instrument({
      type: "harness",
      kind: "script",
      path: name,
      content: await fetchHarness(name),
      context: null,
    });
    if (harness_outcome.type === "failure") {
      return harness_outcome;
    }
    const { location, content } = harness_outcome.data;
    runInContext(content, context, { filename: location ?? name });
  }
  const { link, importModuleDynamically, registerMain } = compileLinker(
    context,
    {
      report,
      resolveDependency,
      instrument,
      fetchTarget,
    },
  );
  const instrument_outcome = applyNegative(
    "instrument",
    instrument(source),
    negative,
  );
  if (instrument_outcome === "negative-success") {
    return { type: "success", data: null };
  }
  if (instrument_outcome.type === "failure") {
    return instrument_outcome;
  }
  const { location, content } = instrument_outcome.data;
  if (source.kind === "module") {
    const create_outcome = applyNegative(
      "parse",
      wrapOutcome(
        () =>
          new SourceTextModule(content, {
            identifier: location ?? source.path,
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
      return { type: "success", data: null };
    }
    if (create_outcome.type === "failure") {
      return create_outcome;
    }
    const module = create_outcome.data;
    registerMain(module, source.path);
    const link_outcome = applyNegative(
      "resolution",
      await wrapOutcomeAsync(() => module.link(link)),
      negative,
    );
    if (link_outcome === "negative-success") {
      return { type: "success", data: null };
    }
    if (link_outcome.type === "failure") {
      return link_outcome;
    }
    const evaluate_outcome = applyNegative(
      "runtime",
      await wrapOutcomeAsync(() => module.evaluate()),
      negative,
    );
    if (evaluate_outcome === "negative-success") {
      return { type: "success", data: null };
    }
    if (evaluate_outcome.type === "failure") {
      return evaluate_outcome;
    }
    return await done;
  } else if (source.kind === "script") {
    const create_outcome = applyNegative(
      "parse",
      wrapOutcome(
        () =>
          new Script(content, {
            filename: location ?? source.path,
            // eslint-disable-next-line object-shorthand
            importModuleDynamically: /** @type {any} */ (
              importModuleDynamically
            ),
          }),
      ),
      negative,
    );
    if (create_outcome === "negative-success") {
      return { type: "success", data: null };
    }
    if (create_outcome.type === "failure") {
      return create_outcome;
    }
    const script = create_outcome.data;
    registerMain(script, source.path);
    const evaluate_outcome = applyNegative(
      "runtime",
      wrapOutcome(() => script.runInContext(context)),
      negative,
    );
    if (evaluate_outcome === "negative-success") {
      return { type: "success", data: null };
    }
    if (evaluate_outcome.type === "failure") {
      return evaluate_outcome;
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
 * ) => Promise<import("./test-case").TestCaseOutcome>}
 */
export const runTestCase = async (test_case, dependencies) => {
  /** @type {null | import("./error-serial").ErrorSerial} */
  let serial = null;
  const outcome = await runTestCaseInner(test_case, {
    ...dependencies,
    report: (name, message) => {
      if (serial === null) {
        serial = { name, message };
      }
      const error = new Error(message);
      error.name = name;
      return error;
    },
  });
  if (serial === null) {
    return outcome;
  } else {
    return { type: "failure", data: serial };
  }
};
