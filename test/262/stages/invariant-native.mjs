import { readFile } from "node:fs/promises";
import { compileExpect, compileCompileAranInstrument } from "./util/index.mjs";

const {
  JSON,
  URL,
  console: { dir },
  WeakMap,
  Reflect: { getPrototypeOf },
  Object: { hasOwn, is: isIdentical },
} = globalThis;

const hasOwnNarrow = /**
 * @type {<K extends string>(
 *   object: object,
 *   key: K,
 * ) => object is object & {[key in K]: unknown}}
 */ (hasOwn);

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
  compileInstrument: compileCompileAranInstrument(
    ({ reject, intrinsic, instrument }) => {
      /** @type {import("./util/aran").Scope[]} */
      let callstack = [];

      /** @type {object} */
      let scope = {
        // @ts-ignore
        __proto__: null,
      };

      /** @type {import("./util/aran").Value[]} */
      let stack = [];

      /**
       * @type {WeakMap<Function, {
       *   scope: object,
       *   kind: "arrow" | "function",
       *   asynchronous: boolean,
       *   generator: boolean,
       *   location: import("./util/aran").Location,
       * }>}
       */
      const closures = new WeakMap();

      /* eslint-disable */
      class InvariantError extends Error {
        constructor(
          /** @type {string} */ message,
          /** @type {unknown} */ data,
        ) {
          super(message);
          this.name = "InvariantError";
          dir(data, { depth: 5, showHidden: true });
          dir(
            { callstack, scope, stack, closures },
            { depth: 5, showHidden: true },
          );
          reject(this);
        }
      }
      /* eslint-enable */

      /**
       * @type {(
       *   value: import("./util/aran").Value,
       *   location: import("./util/aran").Location,
       * ) => import("./util/aran").Value}
       */
      const consume = (value, location) => {
        if (stack.length === 0) {
          throw new InvariantError("Cannot consume value on empty stack", {
            value,
            location,
          });
        } else {
          const other = stack.pop();
          if (isIdentical(value, other)) {
            return value;
          } else {
            throw new InvariantError("Stack value mistmatch", {
              value,
              other,
              location,
            });
          }
        }
      };

      /**
       * @type {(
       *   value: import("./util/aran").Value,
       *   location: import("./util/aran").Location,
       * ) => import("./util/aran").Value}
       */
      const peek = (value, location) => {
        if (stack.length === 0) {
          throw new InvariantError("Cannot consume value on empty stack", {
            value,
            location,
          });
        } else {
          const other = stack[stack.length - 1];
          if (isIdentical(value, other)) {
            return value;
          } else {
            throw new InvariantError("Stack value mistmatch", {
              value,
              other,
              location,
            });
          }
        }
      };

      /**
       * @type {(
       *   value: import("./util/aran").Value,
       *   _location: import("./util/aran").Location,
       * ) => import("./util/aran").Value}
       */
      const produce = (value, _location) => {
        stack.push(value);
        return value;
      };

      /**
       * @type {(
       *   kind: "arrow" | "function",
       *   asynchronous: boolean,
       *   generator: boolean,
       *   value: import("./util/aran").Value,
       *   location: import("./util/aran").Location,
       * ) => import("./util/aran").Value}
       */
      const registerClosure = (
        kind,
        asynchronous,
        generator,
        value,
        location,
      ) => {
        if (typeof value === "function") {
          if (closures.has(value)) {
            throw new InvariantError("Duplicate closure", {
              kind,
              asynchronous,
              generator,
              value,
              location,
            });
          } else {
            closures.set(value, {
              scope,
              kind,
              asynchronous,
              generator,
              location,
            });
            return produce(value, location);
          }
        } else {
          throw new InvariantError("Expected a closure", {
            kind,
            asynchronous,
            generator,
            value,
            location,
          });
        }
      };

      /**
       * @type {<V>(
       *   value: V,
       *   other: V,
       *   message: string,
       *   location: import("./util/aran").Location,
       * ) => V}
       */
      const assertEqual = (value, other, message, location) => {
        if (isIdentical(value, other)) {
          return value;
        } else {
          throw new InvariantError(message, { value, other, location });
        }
      };

      /**
       * @type {(
       *   object: object,
       *   key: string,
       *   message: string,
       *   location: import("./util/aran").Location,
       * ) => unknown}
       */
      const assertPresent = (object, key, message, location) => {
        if (hasOwnNarrow(object, key)) {
          return object[key];
        } else {
          throw new InvariantError(message, { object, key, location });
        }
      };

      /**
       * @type {(
       *   kind: (
       *     | import("../../../type/aran").ProgramKind
       *     | import("../../../type/advice").BlockKind
       *     | import("../../../type/advice").ClosureKind
       *   ),
       *   frame: Record<string, unknown>,
       *   location: import("./util/aran").Location,
       * ) => Record<string, unknown>}
       */
      const enter = (kind, frame, location) => {
        scope = {
          // @ts-ignore
          "__proto__": scope,
          "invariant.kind": kind,
          "invariant.location": location,
          "invarient.restore": stack.length,
          ...frame,
        };
        return frame;
      };

      const failure = (kind, location) => {
        const length = assertPresent(
          scope,
          "invariant.restore",
          "missing",
          location,
        );
        if (typeof length !== "number") {
          throw new InvariantError("expected invariant.restore to be a number");
        }
      };

      /**
       * @type {(
       *   kind: (
       *     | import("../../../type/aran").ProgramKind
       *     | import("../../../type/advice").BlockKind
       *     | import("../../../type/advice").ClosureKind
       *   ),
       *   location: import("./util/aran").Location,
       * ) => void}
       */
      const leave = (kind, location) => {
        assertEqual(
          kind,
          assertPresent(scope, "invariant.kind", "missing", location),
          "mismatch",
          location,
        );
        assertEqual(
          location,
          assertPresent(scope, "invariant.location", "missing", location),
          "mismatch",
          location,
        );
        assertEqual(
          stack.length,
          assertPresent(scope, "invariant.restore", "missing", location),
          "mistmach",
          location,
        );
        const parent = getPrototypeOf(scope);
        if (parent === null) {
          throw new InvariantError("missing root scope", {
            kind,
            location,
          });
        }
        scope = parent;
      };

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
        "block.enter": (kind, labels, frame, location) => {
          scope = {
            // @ts-ignore
            "__proto__": scope,
            "invariant.kind": kind,
            "invariant.location": location,
            "invarient.restore": stack.length,
            ...frame,
          };
          return frame;
        },
        "block.completion": (kind, location) => {},
        "block.failure": (kind, value, location) => {
          const length = scope["invariant.restore"];
          if (stack.length < length) {
            throw new InvariantError(
              "Stack cannot be restored because it is too short",
              {
                kind,
                value,
                scope,
              },
            );
          }
          stack.length = length;
        },
        "block.leave": (kind, location) => {
          if (hasOwn(scope, "invariant.location")) {
            const other = scope["invariant.location"];
            if (isIdentical()) {
            }
            throw new InvariantError("Missing invariant.location in scope", {
              kind,
              labels,
            });
          } else {
          }
          scope = getPrototypeOf(scope);
        },
        "debugger.before": (_location) => {},
        "debugger.after": (_location) => {},
        "break.before": (_label, _location) => {},
        "branch.before": (_kind, value, _location) => value,
        "branch.after": (_kind, _location) => {},
        "intrinsic.after": (name, value, location) => {
          if (hasOwn(intrinsic, name)) {
            const other = intrinsic[name];
            if (isIdentical(value, other)) {
              return produce(value, location);
            } else {
              throw new InvariantError("Intrinsic mismatch", {
                name,
                value,
                other,
                location,
                intrinsic,
              });
            }
          } else {
            throw new InvariantError("Missing intrinsic", {
              name,
              value,
              location,
              intrinsic,
            });
          }
        },
        "primitive.after": produce,
        "import.after": (_source, _specifier, value, _location) => value,
        "function.after": (_asynchronous, _generator, value, _location) =>
          value,
        "arrow.after": (asynchronous, value, location) =>
          registerClosure("arrow", asynchronous, false, value, location),
        "read.after": (variable, value, location) => {
          if (variable in scope) {
            const other = scope[variable];
            if (isIdentical(value, other)) {
              return produce(value, location);
            } else {
              throw new InvariantError("Scope value mismatch", {
                variable,
                value,
                other,
                location,
              });
            }
          } else {
            throw new InvariantError("Missing variable in scope", {
              variable,
              value,
              location,
            });
          }
        },
        "conditional.before": consume,
        "conditional.after": peek,
        "eval.before": (code, context, location) => {
          if (typeof code === "string") {
            return instrument(code, { kind: "eval", context }, location);
          } else {
            return code;
          }
        },
        "eval.after": peek,
        "await.before": (value, _location) => value,
        "await.after": (value, _location) => value,
        "yield.before": (_delegate, value, _location) => value,
        "yield.after": (_delegate, value, _location) => value,
        "drop.before": consume,
        "export.before": (_specifier, value, location) =>
          consume(value, location),
        "write.before": (variable, value, location) => {
          consume(value, location);
          if (variable in scope) {
            scope[variable] = value;
            return value;
          } else {
            throw new InvariantError("Missing variable in scope", {
              variable,
              value,
              location,
            });
          }
        },
        "return.before": (value, _location) => value,
        "apply": (function_, this_, arguments_, location) => {
          if (typeof function_ === "function" && closures.has(function_)) {
            return intrinsic["Reflect.apply"](
              /** @type {Function} */ (function_),
              this_,
              arguments_,
            );
          } else {
            for (let index = arguments_.length; index >= 0; index -= 1) {
              consume(arguments_[index], location);
            }
            consume(this_, location);
            consume(function_, location);
            return produce(
              intrinsic["Reflect.apply"](
                /** @type {Function} */ (function_),
                this_,
                arguments_,
              ),
              location,
            );
          }
        },
        "construct": (constructor_, arguments_, location) => {
          if (
            typeof constructor_ === "function" &&
            closures.has(constructor_)
          ) {
            return intrinsic["Reflect.construct"](
              /** @type {Function} */ (constructor_),
              arguments_,
            );
          } else {
            for (let index = arguments_.length; index >= 0; index -= 1) {
              consume(arguments_[index], location);
            }
            consume(constructor_, location);
            return produce(
              intrinsic["Reflect.construct"](
                /** @type {Function} */ (constructor_),
                arguments_,
              ),
              location,
            );
          }
        },
      };

      return advice;
    },
    { global_declarative_record: "native" },
  ),
};
