/* eslint-disable no-use-before-define */

import { readFile } from "node:fs/promises";
import {
  compileExpect,
  compileFunctionCode,
  compileStandardInstrumentation,
} from "./util/index.mjs";

const { JSON, URL } = globalThis;

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("empty-emulate.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  compileInstrument: ({ warning, record, context }) => {
    /**
     * @type {import("../../../lib").StandardAspect<
     *   null,
     *   import("../../../lib").StandardValue,
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
