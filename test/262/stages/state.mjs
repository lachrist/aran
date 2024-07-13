// @ts-nocheck

import { readFile } from "node:fs/promises";
import {
  isClosureKind,
  isControlKind,
  isProgramKind,
} from "../../../lib/index.mjs";
import {
  compileExpect,
  compileStandardInstrumentation,
} from "./util/index.mjs";

const {
  URL,
  JSON: { parse },
  Array: { isArray },
  undefined,
  Error,
  WeakMap,
  Object: { is, hasOwn },
  console: { dir },
} = globalThis;

/**
 * @type {(
 *   value: import("./state").Value,
 *   other: import("./state").Value,
 * ) => boolean}
 */
const isIdentical = is;

/**
 * @type {(
 *   value: import("./invariant-native").Value
 * ) => value is import("./state").ClosureValue}
 */
const isClosureValue = (value) => typeof value === "function";

/**
 * @type {(
 *   value: import("./invariant-native").Value
 * ) => value is import("./state").ArrayValue}
 */
const isArrayValue = /** @type {any} */ (isArray);

/**
 * @type {(
 *   value: import("./invariant-native").Value
 * ) => value is import("./state").ConstructorValue}
 */
const isConstructorValue = (value) =>
  typeof value === "function" && hasOwn(value, "prototype");

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    parse(
      await readFile(
        new URL("empty-native.manual.json", import.meta.url),
        "utf8",
      ),
    ),
  ),
  compileInstrument: ({ reject, record, warning, context }) => {
    ///////////
    // Error //
    ///////////

    /* eslint-disable */
    class AssertionError extends Error {
      constructor(/** @type {string} */ message) {
        super(message);
        this.name = "AssertionError";
        dir(
          { callstack, closures, suspension },
          { depth: 5, showHidden: true },
        );
        reject(this);
      }
    }
    /* eslint-enable */

    /* eslint-disable */
    class UnreachableError extends Error {
      constructor(/** @type {never} */ data) {
        super("this should never happen");
        this.name = "UnreachableError";
        dir(
          { callstack, closures, suspension },
          { depth: 5, showHidden: true },
        );
        reject(this);
      }
    }
    /* eslint-enable */

    /**
     * @type {(
     *   test: boolean,
     * ) => asserts test is true}
     */
    const assert = (test) => {
      if (!test) {
        throw new AssertionError("Assertion failure");
      }
    };

    /**
     * @type {(
     *   call: import("./state").Call,
     * ) => asserts call is import("./state").Call & { type: "internal"} }
     */
    const assertInternalCall = (call) => {
      assert(call.type === "internal");
    };

    /**
     * @type {<X>(
     *   target: undefined | X,
     * ) => asserts target is X}
     */
    const assertDefined = (target) => {
      assert(target !== undefined);
    };

    /**
     * @type {(
     *   target: import("./state").Value,
     * ) => asserts target is import("./state").ClosureValue}
     */
    const assertClosureValue = (target) => {
      assert(isClosureValue(target));
    };

    /**
     * @type {(
     *   target: import("./state").Value,
     * ) => asserts target is import("./state").ArrayValue}
     */
    const assertArrayValue = (target) => {
      assert(isArrayValue(target));
    };

    /**
     * @type {(
     *   marker: import("./state").Marker,
     * ) => asserts marker is import("./state").Marker & { type: "setup" }}
     */
    const assertSetupMarker = (marker) => {
      assert(marker.type === "setup");
    };

    /**
     * @type {(
     *   marker: import("./state").Marker & { type: "setup" },
     * ) => void}
     */
    const normalizeMarker = (marker) => {
      marker.type = /** @type {any} */ ("normal");
    };

    /**
     * @type {(
     *   kind: import("./state").ClosureKind,
     *   record: { [_ in string]?: import("./state").Value },
     * ) => import("./state").Arrival}
     */
    const extractArrival = (kind, frame) => {
      assert("function.callee" in frame);
      assert("function.arguments" in frame);
      const callee = /** @type {import("./state").Value} */ (
        frame["function.callee"]
      );
      assertClosureValue(callee);
      const input = /** @type {import("./state").Value} */ (
        frame["function.arguments"]
      );
      assertArrayValue(input);
      if (kind === "arrow" || kind === "arrow.async") {
        return {
          type: "arrow",
          callee,
          input,
        };
      } else if (
        kind === "function" ||
        kind === "function.async" ||
        kind === "function.generator" ||
        kind === "function.async.generator"
      ) {
        assert("this" in frame);
        assert("new.target" in frame);
        return {
          type: "function",
          callee,
          self: /** @type {import("./state").Value} */ (frame.this),
          target: /** @type {import("./state").Value} */ (frame["new.target"]),
          input,
        };
      } else {
        throw new UnreachableError(kind);
      }
    };

    ///////////
    // Stack //
    ///////////

    /**
     * @type {<X>(
     *   array: X[],
     * ) => X}
     */
    const pop = (array) => {
      assert(array.length > 0);
      return /** @type {any} */ (array.pop());
    };

    /**
     * @type {<X>(
     *   array: X[],
     * ) => X}
     */
    const peek = (array) => {
      if (array.length === 0) {
        throw new AssertionError("Cannot peek value on empty array");
      } else {
        return array[array.length - 1];
      }
    };

    ///////////
    // State //
    ///////////

    /** @type {import("./state").Call[]} */
    const callstack = [];

    /**
     * @type {WeakMap<Function, import("./state").Scope>}
     */
    const closures = new WeakMap();

    /**
     * @type {WeakMap<import("./state").Marker, import("./state").InternalCall>}
     */
    const suspension = new WeakMap();

    //////////////////
    // Block Aspect //
    //////////////////

    /* eslint-disable no-use-before-define */
    /**
     * @type {import("./state").Aspect<
     *   import("./state").Marker,
     *   import("./state").Valuation,
     * >}
     */
    const aspect = {
      // Block //
      "block@setup": (_parent, kind, head, _path) => ({
        type: "setup",
        labels: isControlKind(kind)
          ? /** @type {import("./state").Label[]} */ (head)
          : [],
      }),
      "block@frame": (marker, kind, frame, _path) => {
        const call = peek(callstack);
        assertSetupMarker(marker);
        const { labels } = marker;
        normalizeMarker(marker);
        if (isProgramKind(kind)) {
          if (
            kind === "module" ||
            kind === "script" ||
            kind === "eval.global" ||
            kind === "eval.local.root"
          ) {
            assert(call.type === "external");
          } else if (kind === "eval.local.deep") {
            assert(call.type === "internal");
          } else {
            throw new UnreachableError(kind);
          }
          callstack.push({
            type: "internal",
            termination: { type: "none" },
            scope: [
              {
                record: frame,
                labels,
              },
            ],
            stack: [],
          });
        } else if (isClosureKind(kind)) {
          const arrival = extractArrival(kind, frame);
          if (call.type === "internal") {
            const { stack } = call;
            for (let index = arrival.input.length - 1; index >= 0; index -= 1) {
              assert(isIdentical(arrival.input[index], pop(stack)));
            }
            if (arrival.type === "arrow") {
              pop(stack);
            } else if (arrival.type === "function") {
              assert(isIdentical(arrival.self, pop(stack)));
            } else {
              throw new UnreachableError(arrival);
            }
            assert(isIdentical(arrival.callee, pop(stack)));
          } else if (call.type !== "external") {
            throw new UnreachableError(call);
          }
          const scope = closures.get(arrival.callee);
          assertDefined(scope);
          callstack.push({
            type: "internal",
            termination: { type: "none" },
            scope: [
              ...scope,
              {
                labels,
                record: frame,
              },
            ],
            stack: [],
          });
        } else if (isControlKind(kind)) {
          assertInternalCall(call);
          call.scope.push({
            labels,
            record: frame,
          });
        }
      },
      "block@success": (_marker, kind, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(call.termination.type === "none");
        if (isClosureKind(kind) || isProgramKind(kind)) {
          call.termination = {
            type: "return",
            result: /** @type {import("./state").Value} */ (value),
          };
        } else if (isControlKind(kind)) {
          call.termination = {
            type: "completion",
          };
        } else {
          throw new UnreachableError(kind);
        }
        return value;
      },
      "block@failure": (marker, _kind, error, _path) => {
        const call = suspension.get(marker);
        if (call !== undefined) {
          suspension.delete(marker);
          call.termination = {
            type: "throw",
            error,
          };
          call.stack.length = 0;
          callstack.push(call);
        }
        return error;
      },
      "block@teardown": (_marker, kind, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(call.stack.length === 0);
        pop(call.scope);
        if (isProgramKind(kind) || isClosureKind(kind)) {
          pop(callstack);
          if (
            call.termination.type === "none" ||
            call.termination.type === "completion" ||
            call.termination.type === "break"
          ) {
            throw new AssertionError("invalid routine termination");
          } else if (call.termination.type === "return") {
            const parent = peek(callstack);
            if (parent.type === "internal") {
              parent.stack.push(call.termination.result);
            } else if (parent.type !== "external") {
              throw new UnreachableError(parent);
            }
          } else if (call.termination.type === "throw") {
            const parent = peek(callstack);
            if (parent.type === "internal") {
              assert(parent.termination.type === "none");
              parent.termination = call.termination;
            } else if (parent.type !== "external") {
              throw new UnreachableError(parent);
            }
          } else {
            throw new UnreachableError(call.termination);
          }
        } else if (isControlKind(kind)) {
          if (call.termination.type === "none") {
            throw new AssertionError("invalid control termination");
          } else if (call.termination.type === "completion") {
            call.termination = { type: "none" };
          } else if (call.termination.type === "break") {
            if (peek(call.scope).labels.includes(call.termination.label)) {
              call.termination = { type: "none" };
            }
          } else if (
            call.termination.type !== "return" &&
            call.termination.type !== "throw"
          ) {
            throw new UnreachableError(call.termination);
          }
        }
      },
      // Call //
      "apply@around": (_marker, callee, self, input, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        if (isClosureValue(callee)) {
          if (closures.has(callee)) {
            return intrinsic["Reflect.apply"](callee, self, input);
          } else {
            try {
              for (let index = input.length - 1; index >= 0; index -= 1) {
                assert(isIdentical(input[index], pop(call.stack)));
              }
              assert(isIdentical(self, pop(call.stack)));
              assert(isIdentical(callee, pop(call.stack)));
              const result = intrinsic["Reflect.apply"](callee, self, input);
              call.stack.push(result);
              return result;
            } catch (error) {
              assert(call.termination.type === "none");
              call.termination = {
                type: "throw",
                // eslint-disable-next-line object-shorthand
                error: /** @type {import("./state").Value} */ (error),
              };
              throw error;
            }
          }
        } else {
          assert(call.termination.type === "none");
          /** @type {import("./state").Value} */
          const error = /** @type {any} */ (
            new intrinsic.TypeError("Not a function or an arrow")
          );
          call.termination = {
            type: "throw",
            error,
          };
          throw error;
        }
      },
      "construct@around": (_marker, callee, input, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        if (isConstructorValue(callee)) {
          if (closures.has(callee)) {
            return intrinsic["Reflect.construct"](callee, input);
          } else {
            try {
              for (let index = input.length - 1; index >= 0; index -= 1) {
                assert(isIdentical(input[index], pop(call.stack)));
              }
              assert(isIdentical(callee, pop(call.stack)));
              const result = intrinsic["Reflect.construct"](callee, input);
              call.stack.push(result);
              return result;
            } catch (error) {
              assert(call.termination.type === "none");
              call.termination = {
                type: "throw",
                // eslint-disable-next-line object-shorthand
                error: /** @type {import("./state").Value} */ (error),
              };
              throw error;
            }
          }
        } else {
          assert(call.termination.type === "none");
          /** @type {import("./state").Value} */
          const error = /** @type {any} */ (
            new intrinsic.TypeError("Not a constructor")
          );
          call.termination = {
            type: "throw",
            error,
          };
          throw error;
        }
      },
      // Abrupt //
      "break@before": (_marker, label, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        call.termination = {
          type: "break",
          label,
        };
      },
      "return@before": (_marker, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        call.termination = {
          type: "return",
          result: value,
        };
        return value;
      },
      // Produce //
      "primitive@after": (_marker, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        call.stack.push(value);
        return value;
      },
      "intrinsic@after": (_marker, name, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        call.stack.push(value);
        assert(
          isIdentical(
            /** @type {import("./state").Value} */ (intrinsic[name]),
            value,
          ),
        );
        return value;
      },
      "import@after": (_marker, _specifier, _source, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        call.stack.push(value);
        return value;
      },
      "read@after": (_marker, variable, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        const { scope } = call;
        for (let index = scope.length - 1; index >= 0; index -= 1) {
          const { record } = scope[index];
          if (variable in record) {
            assert(
              isIdentical(
                /** @type {import("./state").Value} */ (record[variable]),
                value,
              ),
            );
            return value;
          }
        }
        throw new AssertionError("Missing variable");
      },
      "closure@after": (
        _marker,
        _kind,
        _asynchronous,
        _generator,
        value,
        _path,
      ) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(!closures.has(value));
        closures.set(value, call.scope.slice());
        return value;
      },
      // Consume //
      "test@before": (_marker, _kind, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(isIdentical(value, pop(call.stack)));
        return !!value;
      },
      "eval@before": (_marker, context, value, path) => {
        if (typeof value === "string") {
          const call = peek(callstack);
          assertInternalCall(call);
          assert(isIdentical(value, pop(call.stack)));
          return instrumentDeep(value, context, path);
        } else {
          return value;
        }
      },
      "write@before": (_marker, variable, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        const { scope } = call;
        for (let index = scope.length - 1; index >= 0; index -= 1) {
          const { record } = scope[index];
          if (variable in record) {
            record[variable] = value;
            return value;
          }
        }
        throw new AssertionError("Missing variable");
      },
      "export@before": (_marker, _specifier, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(isIdentical(value, pop(call.stack)));
        return value;
      },
      "drop@before": (_marker, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(isIdentical(value, pop(call.stack)));
        return value;
      },
      // Jump //
      "await@before": (marker, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(isIdentical(value, pop(call.stack)));
        assert(!suspension.has(marker));
        suspension.set(marker, call);
        return value;
      },
      "await@after": (marker, value, _path) => {
        const call = suspension.get(marker);
        assertDefined(call);
        suspension.delete(marker);
        callstack.push(call);
        call.stack.push(value);
        return value;
      },
      "yield@before": (marker, _delegate, value, _path) => {
        const call = peek(callstack);
        assertInternalCall(call);
        assert(isIdentical(value, pop(call.stack)));
        assert(!suspension.has(marker));
        suspension.set(marker, call);
        return value;
      },
      "yield@after": (marker, _delegate, value, _path) => {
        const call = suspension.get(marker);
        assertDefined(call);
        suspension.delete(marker);

        callstack.push(call);
        call.stack.push(value);
        return value;
      },
    };
    /* eslint-enable no-use-before-define */

    const { intrinsic, instrumentDeep, instrumentRoot } =
      compileStandardInstrumentation(aspect, {
        record,
        warning,
        context,
        global_declarative_record: "native",
      });
    return instrumentRoot;
  },
};
