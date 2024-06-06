import { readFile } from "node:fs/promises";
import {
  compileExpect,
  compileCompileAranInstrument,
  compileFunctionCode,
} from "./util/index.mjs";

const { JSON, URL } = globalThis;

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing", "empty-emulate"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
      await readFile(
        new URL("transparent-emulate.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  compileInstrument: compileCompileAranInstrument(
    ({ intrinsic, instrument }) => {
      /** @type {Required<import("../../../lib").UnknownStandardAspect>} */
      const advice = {
        "block@setup": (_parent, _kind, _head, _path) => null,
        "block@overframe": (_state, _kind, frame, _path) => frame,
        "block.completion": (_kind, value, _path) => value,
        "block.failure": (_kind, value, _path) => value,
        "block.leave": (_kind, _path) => {},
        "debugger.before": (_path) => {},
        "debugger.after": (_path) => {},
        "break.before": (_label, _path) => {},
        "branch.before": (_kind, value, _path) => value,
        "branch.after": (_kind, _path) => {},
        "intrinsic.after": (_name, value, _path) => value,
        "primitive.after": (primitive, _path) => primitive,
        "import.after": (_source, _specifier, value, _path) => value,
        "closure.after": (_kind, _asynchronous, _generator, value, _path) =>
          value,
        "read.after": (_variable, value, _path) => value,
        "eval.before": (code, context, path) => {
          if (typeof code === "string") {
            return instrument(code, context, path);
          } else {
            return code;
          }
        },
        "eval.after": (value, _path) => value,
        "await.before": (value, _path) => value,
        "await.after": (value, _path) => value,
        "yield.before": (_delegate, value, _path) => value,
        "yield.after": (_delegate, value, _path) => value,
        "drop.before": (value, _path) => value,
        "export.before": (_specifier, value, _path) => value,
        "write.before": (_variable, value, _path) => value,
        "return.before": (value, _path) => value,
        "apply": (function_, this_, arguments_, path) => {
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
            return intrinsic["Reflect.apply"](
              /** @type {function} */ (function_),
              this_,
              arguments_,
            );
          }
        },
        "construct": (constructor_, arguments_, path) => {
          if (constructor_ === intrinsic.Function) {
            return intrinsic.eval(
              instrument(compileFunctionCode(arguments_), null, path),
            );
          } else {
            return intrinsic["Reflect.construct"](
              /** @type {function} */ (constructor_),
              arguments_,
            );
          }
        },
      };
      return advice;
    },
    { global_declarative_record: "emulate" },
  ),
};
