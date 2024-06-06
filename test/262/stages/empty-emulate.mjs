import { readFile } from "node:fs/promises";
import {
  compileExpect,
  compileCompileAranInstrument,
  compileFunctionCode,
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
  compileInstrument: compileCompileAranInstrument(
    ({ intrinsic, instrument }) => ({
      type: "standard",
      data: {
        "eval@before": (_state, code, context, path) => {
          if (typeof code === "string") {
            return instrument(code, context, path);
          } else {
            return intrinsic.undefined;
          }
        },
        "apply@around": (_state, function_, this_, arguments_, path) => {
          if (function_ === intrinsic.eval) {
            if (arguments_.length === 0) {
              return intrinsic.undefined;
            } else {
              const code = arguments_[0];
              if (typeof code === "string") {
                return intrinsic.eval(instrument(code, null, path));
              } else {
                return code;
              }
            }
          } else if (function_ === intrinsic.Function) {
            return intrinsic.eval(
              instrument(compileFunctionCode(arguments_), null, path),
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
              instrument(compileFunctionCode(arguments_), null, path),
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
      },
    }),
    { global_declarative_record: "emulate" },
  ),
};
