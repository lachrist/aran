/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import { compileStandardInstrumentation } from "./util/index.mjs";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";
import { parseList } from "../list.mjs";

const { Set, URL } = globalThis;

const exclusion = new Set([
  ...parseFailureArray(
    [
      await readFile(new URL("identity.failure.txt", import.meta.url), "utf8"),
      await readFile(new URL("parsing.failure.txt", import.meta.url), "utf8"),
      await readFile(
        new URL("empty-standard-native.failure.txt", import.meta.url),
        "utf8",
      ),
    ].join("\n"),
  ).map(getFailureTarget),
  ...parseList(
    await readFile(new URL("transparent.exclude.txt", import.meta.url), "utf8"),
  ),
]);

const negative = parseNegative(
  await readFile(new URL("transparent.negative.txt", import.meta.url), "utf8"),
);

/** @type {import("../types").Stage} */
export default {
  isExcluded: (target) => exclusion.has(target),
  predictStatus: (target) => getNegativeStatus(negative, target),
  listCause: (result) => listNegativeCause(negative, result.target),
  compileInstrument: ({ warning, record, context }) => {
    // If we define this aspect type in a separate declaration file, ts shoke
    // on instantiating the type variables of compileStandardInstrumentation.
    /**
     * @type {import("../../../lib").StandardAspect<
     *   { __brand: "State" },
     *   {
     *     Stack: { __brand: "Value"},
     *     Scope: { __brand: "Value"},
     *     Other: { __brand: "Value"},
     *   },
     * >}
     */
    const advice = {
      "block@setup": (state, _kind, _path) => state,
      "program-block@definition": (_state, _kind, _head, _path) => {},
      "control-block@labeling": (_state, _kind, _labels, _path) => {},
      "block@declaration-overwrite": (_state, _kind, frame, _path) => frame,
      "block@declaration": (_state, _kind, _frame, _path) => {},
      "routine-block@completion": (_state, _kind, value, _path) => value,
      "control-block@completion": (_state, _kind, _path) => {},
      "block@throwing": (_state, _kind, value, _path) => value,
      "block@teardown": (_state, _kind, _path) => {},
      "break@before": (_state, _label, _path) => {},
      "test@before": (_state, _kind, value, _path) => !!value,
      "intrinsic@after": (_state, _name, value, _path) => value,
      "primitive@after": (_state, value, _path) => value,
      "import@after": (_state, _source, _specifier, value, _path) => value,
      "closure@after": (_state, _kind, value, _path) => value,
      "read@after": (_state, _variable, value, _path) => value,
      "eval@before": (_state, context, value, path) => {
        if (typeof value === "string") {
          return /** @type {string & {__brand: "Value"}} */ (
            instrumentDeep(value, context, path)
          );
        } else {
          return value;
        }
      },
      "eval@after": (_state, value, _path) => value,
      "await@before": (_state, value, _path) => value,
      "await@after": (_state, value, _path) => value,
      "yield@before": (_state, _delegate, value, _path) => value,
      "yield@after": (_state, _delegate, value, _path) => value,
      "drop@before": (_state, value, _path) => value,
      "export@before": (_state, _specifier, value, _path) => value,
      "write@before": (_state, _variable, value, _path) => value,
      "apply@around": (_state, callee, self, input, _location) =>
        intrinsic["Reflect.apply"](
          /** @type {Function} */ (/** @type {unknown} */ (callee)),
          self,
          input,
        ),
      "construct@around": (_state, callee, input, _location) =>
        intrinsic["Reflect.construct"](
          /** @type {Function} */ (/** @type {unknown} */ (callee)),
          input,
        ),
    };
    const { intrinsic, instrumentDeep, instrumentRoot } =
      compileStandardInstrumentation(advice, {
        record,
        warning,
        context,
        global_declarative_record: "native",
      });
    return instrumentRoot;
  },
};
