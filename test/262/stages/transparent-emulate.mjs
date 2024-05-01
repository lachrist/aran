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
      /** @type {Required<import("./util/aran").ObjectAdvice>} */
      const advice = {
        // @ts-ignore
        "__proto__": null,
        "program.enter": (_sort, _head, frame, _location) => frame,
        "program.completion": (_sort, value, _location) => value,
        "program.failure": (_sort, value, _location) => value,
        "program.leave": (_sort, _location) => {},
        "closure.enter": (_kind, _links, frame, _location) => frame,
        "closure.failure": (_kind, value, _location) => value,
        "closure.completion": (_kind, value, _location) => value,
        "closure.leave": (_kind, _location) => {},
        "block.enter": (_kind, _labels, frame, _location) => frame,
        "block.completion": (_kind, _location) => {},
        "block.failure": (_kind, value, _location) => value,
        "block.leave": (_kind, _location) => {},
        "debugger.before": (_location) => {},
        "debugger.after": (_location) => {},
        "break.before": (_label, _location) => {},
        "branch.before": (_kind, value, _location) => value,
        "branch.after": (_kind, _location) => {},
        "intrinsic.after": (_name, value, _location) => value,
        "primitive.after": (primitive, _location) => primitive,
        "import.after": (_source, _specifier, value, _location) => value,
        "function.after": (_asynchronous, _generator, value, _location) =>
          value,
        "arrow.after": (_asynchronous, value, _location) => value,
        "read.after": (_variable, value, _location) => value,
        "conditional.before": (value, _location) => value,
        "conditional.after": (value, _location) => value,
        "eval.before": (code, context, location) => {
          if (typeof code === "string") {
            return instrument(code, { kind: "eval", context }, location);
          } else {
            return code;
          }
        },
        "eval.after": (value, _location) => value,
        "await.before": (value, _location) => value,
        "await.after": (value, _location) => value,
        "yield.before": (_delegate, value, _location) => value,
        "yield.after": (_delegate, value, _location) => value,
        "drop.before": (value, _location) => value,
        "export.before": (_specifier, value, _location) => value,
        "write.before": (_variable, value, _location) => value,
        "return.before": (value, _location) => value,
        "apply": (function_, this_, arguments_, location) => {
          if (function_ === intrinsic.eval) {
            if (arguments_.length === 0) {
              return intrinsic.undefined;
            } else {
              const code = arguments_[0];
              if (typeof code === "string") {
                return intrinsic.eval(
                  instrument(code, { kind: "eval", context: null }, location),
                );
              } else {
                return code;
              }
            }
          } else if (function_ === intrinsic.Function) {
            return intrinsic.eval(
              instrument(
                compileFunctionCode(arguments_),
                { kind: "eval", context: null },
                location,
              ),
            );
          } else {
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
              instrument(
                compileFunctionCode(arguments_),
                { kind: "eval", context: null },
                location,
              ),
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
