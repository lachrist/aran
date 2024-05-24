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
      "__proto__": null,
      "eval.before": (code, context, location) => {
        if (typeof code === "string") {
          return instrument(code, context, location);
        } else {
          return intrinsic.undefined;
        }
      },
      "apply": (function_, this_, arguments_, location) => {
        if (function_ === intrinsic.eval) {
          if (arguments_.length === 0) {
            return intrinsic.undefined;
          } else {
            const code = arguments_[0];
            if (typeof code === "string") {
              return intrinsic.eval(instrument(code, null, location));
            } else {
              return code;
            }
          }
        } else if (function_ === intrinsic.Function) {
          return intrinsic.eval(
            instrument(compileFunctionCode(arguments_), null, location),
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
      "construct": (constructor_, arguments_, location) => {
        if (constructor_ === intrinsic.Function) {
          return intrinsic.eval(
            instrument(compileFunctionCode(arguments_), null, location),
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
    }),
    { global_declarative_record: "emulate" },
  ),
};
