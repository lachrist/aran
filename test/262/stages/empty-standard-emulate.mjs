/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import {
  compileFunctionCode,
  compileStandardInstrumentation,
} from "./util/index.mjs";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";
import { ROOT_PATH } from "../../../lib/index.mjs";

const {
  Set,
  URL,
  Array: { from: toArray },
  Reflect: { defineProperty, setPrototypeOf },
} = globalThis;

bare - main - standard - native;
bare - main - flexible - native;

bare - full - weave - standard - builtin;
bare - full - weave - flexible - builtin;
bare - full - weave - flexible - emulate;
bare - full - weave - standard - emulate;

bare - full - patch - standard - builtin;
bare - full - patch - flexible - builtin;
bare - full - patch - flexible - emulate;
bare - full - patch - standard - emulate;

const exclusion = new Set(
  parseFailureArray(
    [
      await readFile(new URL("identity.failure.txt", import.meta.url), "utf8"),
      await readFile(new URL("parsing.failure.txt", import.meta.url), "utf8"),
    ].join("\n"),
  ).map(getFailureTarget),
);

const negative = parseNegative(
  await readFile(new URL("empty.negative.txt", import.meta.url), "utf8"),
);

/** @type {import("../types").Stage} */
export default {
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (target) => getNegativeStatus(negative, target),
  listCause: (result) => listNegativeCause(negative, result.target),
  compileInstrument: ({ warning, record, context }) => {
    /**
     * @type {import("../../../lib").StandardAspect<
     *   null,
     *   import("../../../lib").Valuation,
     * >}
     */
    const aspect = {
      "eval@before": (_state, context, value, path) => {
        if (typeof value === "string") {
          return instrumentNext({
            kind: "eval",
            situ: "local.deep",
            code: value,
            context,
            path,
          });
        } else {
          return value;
        }
      },
    };
    const { intrinsic, instrumentRoot, instrumentNext } =
      compileStandardInstrumentation(aspect, {
        global_declarative_record: "emulate",
        warning,
        record,
        context,
      });
    /** @type {import("../types").$262} */
    const $262 = /** @type {any} */ (intrinsic["aran.global"]).$262;
    const { evalScript } = $262;
    evalScript("const eval = globalThis.eval");
    $262.evalScript = (value) =>
      evalScript(
        instrumentNext({
          kind: "script",
          situ: "global",
          code: value,
          context: {},
          path: ROOT_PATH,
        }),
      );
    const {
      Function: { prototype: function_prototype },
      eval: evalGlobal,
    } = intrinsic["aran.global"];
    intrinsic["aran.global"].eval = (/** @type {unknown} */ code) => {
      if (typeof code === "string") {
        return evalGlobal(
          instrumentNext({
            kind: "eval",
            situ: "global",
            code,
            context: {},
            path: ROOT_PATH,
          }),
        );
      } else {
        return code;
      }
    };
    setPrototypeOf(intrinsic["aran.global"].eval, function_prototype);
    defineProperty(intrinsic["aran.global"].eval, "name", {
      // @ts-ignore
      __proto__: null,
      value: "eval",
      writable: false,
      enumerable: false,
      configurable: true,
    });
    intrinsic["aran.global"].Function = /** @type {FunctionConstructor} */ (
      // eslint-disable-next-line local/no-function, local/no-rest-parameter
      function Function(...input) {
        return evalGlobal(
          instrumentNext({
            kind: "eval",
            situ: "global",
            code: compileFunctionCode(toArray(input)),
            context: {},
            path: ROOT_PATH,
          }),
        );
      }
    );
    setPrototypeOf(intrinsic["aran.global"].Function, function_prototype);
    defineProperty(intrinsic["aran.global"].Function, "prototype", {
      // @ts-ignore
      __proto__: null,
      value: function_prototype,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    defineProperty(intrinsic["aran.global"].Function, "length", {
      // @ts-ignore
      __proto__: null,
      value: 1,
      writable: false,
      enumerable: false,
      configurable: true,
    });
    return instrumentRoot;
  },
};
