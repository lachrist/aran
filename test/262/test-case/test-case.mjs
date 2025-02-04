import { Script, SourceTextModule, runInContext } from "node:vm";
import { createRealm } from "./realm.mjs";
import { show, serializeError } from "../util/index.mjs";
import { compileLinker } from "./linker.mjs";
import { AranNegativeError, AranTypeError } from "../error.mjs";
import { cpuUsage } from "node:process";

const { Promise } = globalThis;

/**
 * @type {() => import("./termination").Termination}
 */
const makeAsynchronousTermination = () => {
  /** @type {(error: null | import("../util/error-serial").ErrorSerial) => void} */
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

/** @type {import("./termination").Termination} */
const termination = {
  done: Promise.resolve(null),
  print: (_unknown) => {
    // console.dir(_unknown, { depth: null });
  },
};

/**
 * @type {<X>(
 *   callback: () => X
 * ) => import("../util/outcome").Outcome<
 *   X,
 *   import("../util/error-serial").ErrorSerial,
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
 *   import("../util/outcome").Outcome<
 *     X,
 *     import("../util/error-serial").ErrorSerial,
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
 *   outcome: import("../util/outcome").Outcome<
 *     X,
 *     import("../util/error-serial").ErrorSerial,
 *   >,
 *   negative: null | import("../metadata").Negative,
 * ) => "negative-success" | import("../util/outcome").Outcome<
 *   X,
 *   import("../util/error-serial").ErrorSerial,
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
 *   content: string,
 *   directive: import("../test-case").Directive,
 * ) => string}
 */
const applyDirective = (content, directive) => {
  switch (directive) {
    case "none": {
      return content;
    }
    case "use-strict": {
      return `"use strict";\n${content}`;
    }
    default: {
      throw new AranTypeError(directive);
    }
  }
};

/**
 * @type {<H, X>(
 *   handle: H,
 *   state: X,
 *   test_case: import("../test-case").TestCase,
 *   dependencies: {
 *     prepare: import("../staging/stage").Prepare<X>,
 *     instrument: import("../staging/stage").Instrument<H>,
 *     signalNegative: (cause: string) => Error,
 *     resolveDependency: import("../fetch").ResolveDependency,
 *     fetchHarness: import("../fetch").FetchHarness,
 *     fetchTarget: import("../fetch").FetchTarget,
 *   },
 * ) => Promise<null | import("../util/error-serial").ErrorSerial>}
 */
export const execTestCaseInner = async (
  handle,
  state,
  { kind, directive, path: path1, negative, asynchronous, includes },
  {
    prepare,
    instrument,
    signalNegative,
    resolveDependency,
    fetchHarness,
    fetchTarget,
  },
) => {
  const content1 = applyDirective(await fetchTarget(path1), directive);
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : termination;
  const { context } = createRealm(state, {
    prepare,
    print,
    signalNegative,
  }).aran;
  for (const name of includes) {
    try {
      const { path, content } = instrument(handle, {
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
    handle,
    context,
    { resolveDependency, instrument, fetchTarget },
  );
  const instrument_outcome = applyNegative(
    "instrument",
    wrapOutcome(() =>
      instrument(handle, {
        type: "main",
        kind,
        path: path1,
        content: content1,
      }),
    ),
    negative,
  );
  if (instrument_outcome === "negative-success") {
    return null;
  }
  if (instrument_outcome.type === "failure") {
    return instrument_outcome.data;
  }
  const { path: path2, content: content2 } = instrument_outcome.data;
  if (kind === "module") {
    const create_outcome = applyNegative(
      "parse",
      wrapOutcome(
        () =>
          new SourceTextModule(content2, {
            identifier: path2,
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
    registerMain(module, path1);
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
  } else if (kind === "script") {
    const create_outcome = applyNegative(
      "parse",
      wrapOutcome(
        () =>
          new Script(content2, {
            filename: path2,
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
    registerMain(script, path1);
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
    throw new AranTypeError(kind);
  }
};

/**
 * @type {<H, X>(
 *   handle: H,
 *   state: X,
 *   test_case: import("../test-case").TestCase,
 *   dependencies: {
 *     prepare: import("../staging/stage").Prepare<X>,
 *     instrument: import("../staging/stage").Instrument<H>,
 *     resolveDependency: import("../fetch").ResolveDependency,
 *     fetchHarness: import("../fetch").FetchHarness,
 *     fetchTarget: import("../fetch").FetchTarget,
 *   },
 * ) => Promise<{
 *   expect: string[],
 *   actual: null | import("../util/error-serial").ErrorSerial,
 *   time: { user: number, system: number },
 * }>}
 */
export const execTestCase = async (handle, state, test_case, dependencies) => {
  /** @type {string[]} */
  const expect = [];
  const time = cpuUsage();
  const error = await execTestCaseInner(handle, state, test_case, {
    ...dependencies,
    signalNegative: (cause) => {
      expect.push(cause);
      return new AranNegativeError(cause);
    },
  });
  return { expect, actual: error, time: cpuUsage(time) };
};
