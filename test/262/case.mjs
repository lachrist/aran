import { Script, SourceTextModule } from "node:vm";
import { runHarness } from "./harness.mjs";
import { createRealm } from "./realm.mjs";
import { inspectError, inspectMessage } from "./inspect.mjs";
import { compileLinker } from "./linker.mjs";

const { Promise, Error } = globalThis;

/**
 * @type {() => {
 *   done: Promise<import("./types").TestError[]>,
 *   print: (message: string) => void,
 * }}
 */
const makeAsynchronousTermination = () => {
  /** @type {(errors: import("./types").TestError[]) => void} */
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
 *   done: Promise<import("./types").TestError[]>,
 *   print: (message: string) => void,
 * }}
 */
const makeSynchronousTermination = () => {
  /** @type {import("./types").TestError[]} */
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
 *   options: import("./types").TestCase,
 *   instrument: (code: string, kind: "script" | "module") => string,
 * ) => Promise<import("./types").TestError[]>}
 */
export const runTestCase = async (
  { url, content, asynchronous, includes, module },
  instrument,
) => {
  /** @type {import("./types").TestError[]} */
  const errors = [];
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : makeSynchronousTermination();
  const context = { __proto__: null };
  createRealm({
    context,
    origin: url,
    print,
    RealmError: class RealmError extends Error {
      /** @param {import("./types").RealmFeature} feature */
      constructor(feature) {
        super(`$262.${feature} is not implemented`);
        this.name = "RealmError";
        errors.push({
          type: "realm",
          feature,
        });
      }
    },
    instrument,
  });
  for (const url of includes) {
    const outcome = await runHarness(url, context);
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
      const module = new SourceTextModule(instrument(content, "module"), {
        identifier: url.href,
        context,
        importModuleDynamically: /** @type {any} */ (link),
      });
      await register(module, url);
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
      const script = new Script(instrument(content, "script"), {
        filename: url.href,
        importModuleDynamically: /** @type {any} */ (link),
      });
      await register(script, url);
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
