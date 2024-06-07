/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import {
  compileExpect,
  compileStandardInstrumentation,
} from "./util/index.mjs";

const { JSON, URL } = globalThis;

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing", "empty-native"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("transparent-native.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
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
      "block@setup": (state, _kind, _head, _path) => state,
      "block@overframe": (_state, _kind, frame, _path) => frame,
      "block@frame": (_state, _kind, _frame, _path) => {},
      "block@success": (_state, _kind, value, _path) => value,
      "block@failure": (_state, _kind, value, _path) => value,
      "block@teardown": (_state, _kind, _path) => {},
      "break@before": (_state, _label, _path) => {},
      "test@before": (_state, _kind, value, _path) => !!value,
      "intrinsic@after": (_state, _name, value, _path) => value,
      "primitive@after": (_state, value, _path) => value,
      "import@after": (_state, _source, _specifier, value, _path) => value,
      "closure@after": (
        _state,
        _kind,
        _asynchronous,
        _generator,
        value,
        _path,
      ) => value,
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
      "return@before": (_state, value, _path) => value,
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
