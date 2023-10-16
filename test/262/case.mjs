import { Script, SourceTextModule } from "node:vm";
import { runHarness } from "./harness.mjs";
import { createRealm } from "./realm.mjs";
import { inspectError, inspectMessage } from "./inspect.mjs";
import { compileLinker } from "./linker.mjs";

const { Promise, Error } = globalThis;

/**
 * @type {() => {
 *   done: Promise<test262.Error[]>,
 *   print: (message: string) => void,
 * }}
 */
const makeAsynchronousTermination = () => {
  /** @type {(errors: test262.Error[]) => void} */
  let resolve;
  return {
    done: new Promise((resolve_) => {
      resolve = resolve_;
    }),
    print: (message) => {
      const outcome = inspectMessage(message);
      if (outcome.type === "success") {
        // console.log(message);
        if (message === "Test262:AsyncTestComplete") {
          resolve([]);
        }
        if (message.startsWith("Test262:AsyncTestFailure:")) {
          resolve([
            {
              type: "async",
              message,
            },
          ]);
        }
      }
      if (outcome.type === "failure") {
        resolve([outcome.error]);
      }
    },
  };
};

/**
 * @type {() => {
 *   done: Promise<test262.Error[]>,
 *   print: (message: string) => void,
 * }}
 */
const makeSynchronousTermination = () => {
  /** @type {test262.Error[]} */
  const errors = [];
  return {
    done: Promise.resolve(errors),
    print: (message) => {
      const outcome = inspectMessage(message);
      if (outcome.type === "success") {
        // console.log(message);
        if (message.startsWith("Test262:AsyncTestFailure:")) {
          errors.push({
            type: "async",
            message,
          });
        }
      }
      if (outcome.type === "failure") {
        errors.push(outcome.error);
      }
    },
  };
};

/**
 * @type {(
 *   options: test262.Case,
 *   instrumenter: test262.Instrumenter,
 * ) => Promise<test262.Error[]>}
 */
export const runTestCase = async (
  { url, content, asynchronous, includes, module },
  instrumenter,
) => {
  /** @type {test262.Error[]} */
  const errors = [];
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : makeSynchronousTermination();
  const context = { __proto__: null };
  const { instrument } = instrumenter;
  createRealm({
    context,
    origin: url,
    print,
    makeRealmError: (feature) => {
      errors.push({
        type: "realm",
        feature,
      });
      return new Error(`$262.${feature} is not implemented`);
    },
    instrumenter,
  });
  for (const url of includes) {
    const outcome = await runHarness(url, context, instrument);
    if (outcome.type === "failure") {
      return [outcome.error];
    }
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
          errors.push(inspectError("runtime", error));
        }
      } catch (error) {
        errors.push(inspectError("resolution", error));
      }
    } catch (error) {
      errors.push(inspectError("parse", error));
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
        errors.push(inspectError("runtime", error));
      }
    } catch (error) {
      errors.push(inspectError("parse", error));
    }
  }
  if (errors.length === 0) {
    errors.push(...(await done));
  }
  return errors;
};
