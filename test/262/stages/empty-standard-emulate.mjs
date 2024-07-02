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

const { Set, URL } = globalThis;

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
          return instrumentDeep(value, context, path);
        } else {
          return value;
        }
      },
      "apply@around": (_state, function_, this_, arguments_, path) => {
        if (function_ === intrinsic.eval) {
          if (arguments_.length === 0) {
            return intrinsic.undefined;
          } else {
            const code = arguments_[0];
            if (typeof code === "string") {
              return intrinsic.eval(instrumentDeep(code, null, path));
            } else {
              return code;
            }
          }
        } else if (function_ === intrinsic.Function) {
          return intrinsic.eval(
            instrumentDeep(compileFunctionCode(arguments_), null, path),
          );
        } else {
          // Use Reflect.apply from test case's realm.
          // Else, it might throw a type error from this realm.
          return intrinsic["Reflect.apply"](
            /** @type {function} */ (function_),
            this_,
            arguments_,
          );
        }
      },
      "construct@around": (_state, constructor_, arguments_, path) => {
        if (constructor_ === intrinsic.Function) {
          return intrinsic.eval(
            instrumentDeep(compileFunctionCode(arguments_), null, path),
          );
        } else {
          // Use Reflect.construct from test case's realm
          // Else, it might throw a type error from this realm.
          return intrinsic["Reflect.construct"](
            /** @type {function} */ (constructor_),
            arguments_,
          );
        }
      },
    };
    const { intrinsic, instrumentRoot, instrumentDeep } =
      compileStandardInstrumentation(aspect, {
        global_declarative_record: "emulate",
        warning,
        record,
        context,
      });
    return instrumentRoot;
  },
};