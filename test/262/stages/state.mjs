import { readFile } from "node:fs/promises";
import { setupAran } from "../aran/index.mjs";
import {
  getNegativeStatus,
  listNegativeCause,
  parseNegative,
} from "../negative.mjs";
import { getFailureTarget, parseFailureArray } from "../failure.mjs";
import {
  isClosureKind,
  isControlKind,
  isProgramKind,
} from "../../../lib/index.mjs";

const {
  Set,
  URL,
  Array: { isArray },
  Error,
  WeakMap,
  Object: { is, hasOwn, assign },
  console: { log, dir },
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
 *   value: import("./state").Value
 * ) => value is import("./state").ArrayValue}
 */
const isArrayValue = /** @type {any} */ (isArray);

/* eslint-disable */
/**
 * @type {(
 *   report: (error: Error) => void,
 *   logged: boolean,
 * ) => new (context: object) => Error}
 */
const compileAssertionError = (report, logged) =>
  class AssertionError extends Error {
    constructor(/** @type {object} */ context) {
      super();
      this.name = "AranAssertionError";
      if (!logged) {
        logged = true;
        log(this.name);
        dir(context);
      }
      report(this);
    }
  };
/* eslint-enable */

/* eslint-disable */
/**
 * @type {(
 *   report: (error: Error) => void,
 * ) => new (data: never) => Error}
 */
const compileUnreachableError = (report) =>
  class UnreachableError extends Error {
    constructor(/** @type {never} */ data) {
      super();
      this.name = "AranUnreachableError";
      log(this.name);
      dir(data, { depth: 3, showHidden: true });
      report(this);
    }
  };
/* eslint-enable */

/**
 * @type {(
 *   report: {
 *     AssertionError: new (context: object) => Error,
 *     UnreachableError: new (data: never) => Error,
 *   },
 * ) => import("../aran").MakeAspect<
 *   import("./state").State,
 *   import("./state").Value,
 * >}
 */
const compileMakeAspect =
  ({ AssertionError, UnreachableError }) =>
  (intrinsics, { instrument }) => {
    /**
     * @type {(
     *   test: boolean,
     *   context: object,
     * ) => void}
     */
    const assert = (test, context) => {
      if (!test) {
        throw new AssertionError(context);
      }
    };

    /**
     * @type {<X>(
     *   value: X | null,
     *   context: object,
     * ) => asserts value is X}
     */
    const assertNotNull = (value, context) => {
      assert(value !== null, context);
    };

    /**
     * @type {<X>(
     *   array: X[],
     *   context: object,
     * ) => X}
     */
    const pop = (array, context) => {
      assert(array.length > 0, context);
      return /** @type {any} */ (array.pop());
    };

    /**
     * @type {WeakMap<Function, import("../../../lib").ClosureKind>}
     */
    const closures = new WeakMap();

    /**
     * @type {import("./state").Transit}
     */
    let transit = { type: "external" };

    /* eslint-disable no-use-before-define */
    /**
     * @type {import("../../../lib").StandardAspect<
     *   import("./state").State,
     *   import("./state").Valuation,
     * >}
     */
    const aspect = {
      // Block //
      "block@setup": (state, kind, path) => {
        const context = { type: "block@setup", transit, state, kind, path };
        // console.dir(context);
        if (isClosureKind(kind)) {
          assert(
            transit.type === "apply" ||
              transit.type === "construct" ||
              transit.type === "external",
            context,
          );
        } else if (isControlKind(kind)) {
          assert(
            transit.type === "regular" ||
              (transit.type === "throw" &&
                (kind === "catch" || kind === "finally")) ||
              (transit.type === "break" && kind === "finally"),
            context,
          );
        } else if (isProgramKind(kind)) {
          assert(transit.type === "external", context);
        } else {
          throw new UnreachableError(kind);
        }
        const origin = transit;
        transit = { type: "regular" };
        return {
          parent: state,
          kind,
          path,
          origin,
          scope: {},
          stack: [],
          labeling: [],
          suspension: "none",
        };
      },
      "control-block@labeling": (state, kind, labels, path) => {
        const context = {
          type: "control-block@labeling",
          transit,
          state,
          kind,
          labels,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        // Labels comes from the target realm.
        // So it is subject to prototype polluation.
        // So `state.labeling.push(...labels)` is unsafe
        const { length } = labels;
        for (let index = 0; index < length; index += 1) {
          state.labeling.push(labels[index]);
        }
      },
      "block@declaration": (state, kind, frame, path) => {
        const context = {
          type: "block@declaration",
          transit,
          state,
          kind,
          frame,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        if ("catch.error" in frame) {
          if (state.origin.type === "throw") {
            assert(
              isIdentical(frame["catch.error"], state.origin.error),
              context,
            );
          }
        }
        if ("function.callee" in frame) {
          if (
            state.origin.type === "apply" ||
            state.origin.type === "construct"
          ) {
            assert(
              isIdentical(frame["function.callee"], state.origin.callee),
              context,
            );
          }
        }
        if ("new.target" in frame) {
          if (state.origin.type === "construct") {
            assert(
              isIdentical(frame["new.target"], state.origin.callee),
              context,
            );
          }
        }
        if ("this" in frame) {
          if (state.origin.type === "apply") {
            assert(isIdentical(frame.this, state.origin.this), context);
          }
        }
        if ("function.arguments" in frame) {
          if (
            state.origin.type === "apply" ||
            state.origin.type === "construct"
          ) {
            const input1 = frame["function.arguments"];
            if (
              !isArrayValue(/** @type {import("./state").Value} */ (input1))
            ) {
              throw new AssertionError(input1);
            }
            const input2 = state.origin.arguments;
            assert(input1.length === input2.length, context);
            const length = input1.length;
            for (let index = 0; index < length; index += 1) {
              assert(isIdentical(input1[index], input2[index]), context);
            }
          }
        }
        assign(state.scope, frame);
      },
      "generator-block@suspension": (state, kind, path) => {
        const context = {
          type: "generator-block@suspension",
          transit,
          state,
          kind,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(transit.type === "regular", context);
        if (
          state.origin.type === "apply" ||
          state.origin.type === "construct"
        ) {
          transit = { type: "yield" };
          state.origin = { type: "external" };
        } else if (state.origin.type === "external") {
          transit = { type: "external" };
        } else if (
          state.origin.type === "return" ||
          state.origin.type === "completion" ||
          state.origin.type === "throw" ||
          state.origin.type === "break" ||
          state.origin.type === "regular" ||
          state.origin.type === "await" ||
          state.origin.type === "yield"
        ) {
          throw new AssertionError(context);
        } else {
          throw new UnreachableError(state.origin);
        }
      },
      "generator-block@resumption": (state, kind, path) => {
        const context = {
          type: "generator-block@resumption",
          transit,
          state,
          kind,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(transit.type === "external", context);
        transit = { type: "regular" };
      },
      "control-block@completion": (state, kind, path) => {
        const context = {
          type: "control-block@completion",
          transit,
          state,
          kind,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(state.stack.length === 0, context);
        assert(transit.type === "regular", context);
        transit = { type: "completion" };
      },
      "routine-block@completion": (state, kind, value, path) => {
        const context = {
          type: "routine-block@completion",
          transit,
          state,
          kind,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(transit.type === "regular", context);
        transit = { type: "return", result: value };
        return value;
      },
      "block@throwing": (state, kind, value, path) => {
        const context = {
          type: "block@throwing",
          transit,
          state,
          kind,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        if (state.suspension === "none") {
          assert(
            transit.type === "throw" && isIdentical(transit.error, value),
            context,
          );
        } else if (
          state.suspension === "eval" ||
          state.suspension === "await" ||
          state.suspension === "yield"
        ) {
          assert(transit.type === "external", context);
          transit = { type: "throw", error: value };
          state.suspension = "none";
        } else {
          throw new UnreachableError(state.suspension);
        }
        state.stack.length = 0;
        return value;
      },
      "block@teardown": (state, kind, path) => {
        const context = { type: "block@teardown", transit, state, kind, path };
        // console.dir(context);
        assertNotNull(state, context);
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(state.stack.length === 0, context);
        if (transit.type === "completion") {
          if (kind === "finally") {
            transit = state.origin;
          } else {
            transit = { type: "regular" };
          }
        } else if (transit.type === "break") {
          if (state.labeling.includes(transit.label)) {
            transit = { type: "regular" };
          }
        } else if (transit.type === "return" || transit.type === "throw") {
          if (state.origin.type === "external") {
            transit = { type: "external" };
          }
        } else if (
          transit.type === "await" ||
          transit.type === "yield" ||
          transit.type === "regular" ||
          transit.type === "external" ||
          transit.type === "apply" ||
          transit.type === "construct"
        ) {
          throw new AssertionError(context);
        } else {
          throw new UnreachableError(transit);
        }
      },
      // Call //
      "apply@around": (state, callee, this_, arguments_, path) => {
        const context = {
          type: "apply@around",
          transit,
          state,
          callee,
          this_,
          arguments_,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        for (let index = arguments_.length - 1; index >= 0; index -= 1) {
          assert(
            isIdentical(arguments_[index], pop(state.stack, context)),
            context,
          );
        }
        assert(isIdentical(this_, pop(state.stack, context)), context);
        assert(isIdentical(callee, pop(state.stack, context)), context);
        if (closures.has(/** @type {any} */ (callee))) {
          const kind = /** @type {import("../../../lib").ClosureKind} */ (
            closures.get(/** @type {any} */ (callee))
          );
          assert(transit.type === "regular", state);
          transit = /** @type {import("./state").Transit} */ ({
            type: "apply",
            callee,
            this: this_,
            arguments: arguments_,
          });
          const result = intrinsics["Reflect.apply"](
            /** @type {any} */ (callee),
            this_,
            arguments_,
          );
          const context = {
            type: "apply@after-success",
            transit,
            state,
            result,
          };
          if (kind === "function" || kind === "arrow" || kind === "method") {
            assert(
              transit.type === "return" && isIdentical(transit.result, result),
              context,
            );
          } else if (
            kind === "async-function" ||
            kind === "async-arrow" ||
            kind === "async-method"
          ) {
            assert(
              transit.type === "await" || transit.type === "return",
              context,
            );
          } else if (kind === "generator" || kind === "async-generator") {
            assert(transit.type === "yield", context);
          } else {
            throw new UnreachableError(kind);
          }
          transit = { type: "regular" };
          state.stack.push(result);
          // console.dir(context);
          return result;
        } else {
          assert(transit.type === "regular", context);
          transit = { type: "external" };
          try {
            const result = intrinsics["Reflect.apply"](
              /** @type {any} */ (callee),
              this_,
              arguments_,
            );
            const context = {
              type: "apply@after-success",
              transit,
              state,
              result,
            };
            assert(transit.type === "external", context);
            transit = { type: "regular" };
            state.stack.push(result);
            return result;
          } catch (error) {
            const context = {
              type: "apply@after-failure",
              transit,
              state,
              error,
            };
            // console.dir(context);
            assert(transit.type === "external", context);
            transit = {
              type: "throw",
              // eslint-disable-next-line object-shorthand
              error: /** @type {import("./state").Value} */ (error),
            };
            throw error;
          }
        }
      },
      "construct@around": (state, callee, arguments_, path) => {
        const context = {
          type: "construct@before",
          transit,
          state,
          callee,
          arguments_,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        for (let index = arguments_.length - 1; index >= 0; index -= 1) {
          assert(
            isIdentical(arguments_[index], pop(state.stack, context)),
            context,
          );
        }
        assert(isIdentical(callee, pop(state.stack, context)), {
          callee,
          state,
        });
        if (closures.has(/** @type {any} */ (callee))) {
          assert(transit.type === "regular", state);
          transit = /** @type {import("./state").Transit} */ ({
            type: "construct",
            callee,
            arguments: arguments_,
          });
          const result = intrinsics["Reflect.construct"](
            /** @type {any} */ (callee),
            arguments_,
          );
          const context = {
            type: "construct@after-success",
            transit,
            state,
            result,
          };
          // console.dir(context);
          assert(
            transit.type === "return" && transit.result === result,
            context,
          );
          transit = { type: "regular" };
          state.stack.push(result);
          return result;
        } else {
          assert(transit.type === "regular", context);
          transit = { type: "external" };
          try {
            const result = intrinsics["Reflect.construct"](
              /** @type {any} */ (callee),
              arguments_,
            );
            const context = {
              type: "construct@after-success",
              transit,
              state,
              result,
            };
            // console.dir(context);
            assert(transit.type === "external", context);
            transit = { type: "regular" };
            state.stack.push(result);
            return result;
          } catch (error) {
            const context = {
              type: "construct@after-failure",
              transit,
              state,
              error,
            };
            // console.dir(context);
            assert(transit.type === "external", context);
            transit = {
              type: "throw",
              // eslint-disable-next-line object-shorthand
              error: /** @type {import("./state").Value} */ (error),
            };
            throw error;
          }
        }
      },
      // Abrupt //
      "break@before": (state, label, path) => {
        const context = { type: "break@before", transit, state, label, path };
        // console.dir(context);
        assertNotNull(state, context);
        assert(transit.type === "regular", context);
        transit = {
          type: "break",
          label,
        };
      },
      // Produce //
      "primitive@after": (state, value, path) => {
        const context = {
          type: "primitive@after",
          transit,
          state,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        state.stack.push(value);
        return value;
      },
      "intrinsic@after": (state, name, value, path) => {
        const context = {
          type: "intrinsic@after",
          transit,
          state,
          name,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(
          name in intrinsics &&
            isIdentical(
              /** @type {import("./state").Value} */ (intrinsics[name]),
              value,
            ),
          context,
        );
        state.stack.push(value);
        return value;
      },
      "import@after": (state, specifier, source, value, path) => {
        const context = {
          type: "import@after",
          transit,
          state,
          specifier,
          source,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        state.stack.push(value);
        return value;
      },
      "read@after": (state, variable, value, path) => {
        const context = {
          type: "read@after",
          transit,
          state,
          variable,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        /** @type {import("./state").State | null} */
        let current = state;
        while (current !== null) {
          if (hasOwn(current.scope, variable)) {
            assert(
              isIdentical(/** @type {any} */ (current.scope)[variable], value),
              context,
            );
            state.stack.push(value);
            return value;
          }
          current = current.parent;
        }
        throw new AssertionError(context);
      },
      "closure@after": (state, kind, value, path) => {
        const context = {
          type: "closure@after",
          transit,
          state,
          kind,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(!closures.has(value), context);
        closures.set(value, kind);
        state.stack.push(value);
        return value;
      },
      // Consume //
      "test@before": (state, kind, value, path) => {
        const context = {
          type: "test@before",
          transit,
          state,
          kind,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        return !!value;
      },
      "write@before": (state, variable, value, path) => {
        const context = {
          type: "write@before",
          transit,
          state,
          variable,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        /** @type {import("./state").State | null} */
        let current = state;
        while (current !== null) {
          if (hasOwn(current.scope, variable)) {
            current.scope[variable] = value;
            return value;
          }
          current = current.parent;
        }
        throw new AssertionError(context);
      },
      "export@before": (state, specifier, value, path) => {
        const context = {
          type: "export@before",
          transit,
          state,
          specifier,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        return value;
      },
      "drop@before": (state, value, path) => {
        const context = { type: "drop@before", transit, state, value, path };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        return value;
      },
      // Jump //
      "eval@before": (state, reboot, value, path) => {
        const context = {
          type: "eval@before",
          transit,
          state,
          reboot,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        assert(state.suspension === "none", context);
        state.suspension = "eval";
        if (typeof value === "string") {
          assert(transit.type === "regular", context);
          transit = { type: "external" };
          return instrument(value, path, reboot);
        } else {
          return value;
        }
      },
      "eval@after": (state, value, path) => {
        const context = { type: "eval@after", transit, state, value, path };
        // console.dir(context);
        assertNotNull(state, context);
        assert(transit.type === "external", context);
        transit = { type: "regular" };
        assert(state.suspension === "eval", context);
        state.suspension = "none";
        state.stack.push(value);
        return value;
      },
      "await@before": (state, value, path) => {
        const context = { type: "await@before", transit, state, value, path };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        assert(transit.type === "regular", context);
        let current = state;
        while (isControlKind(current.kind)) {
          const next = current.parent;
          assertNotNull(next, context);
          current = next;
        }
        if (current.origin.type === "external") {
          transit = { type: "external" };
        } else {
          transit = { type: "await" };
          current.origin = { type: "external" };
        }
        assert(state.suspension === "none", context);
        state.suspension = "await";
        return value;
      },
      "await@after": (state, value, path) => {
        const context = { type: "await@after", transit, state, value, path };
        // console.dir(context);
        assertNotNull(state, context);
        assert(transit.type === "external", context);
        transit = { type: "regular" };
        assert(state.suspension === "await", context);
        state.suspension = "none";
        state.stack.push(value);
        return value;
      },
      "yield@before": (state, delegate, value, path) => {
        const context = {
          type: "yield@before",
          transit,
          state,
          delegate,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(isIdentical(pop(state.stack, context), value), context);
        assert(transit.type === "regular", context);
        transit = { type: "external" };
        assert(state.suspension === "none", context);
        state.suspension = "yield";
        return value;
      },
      "yield@after": (state, delegate, value, path) => {
        const context = {
          type: "yield@after",
          transit,
          state,
          delegate,
          value,
          path,
        };
        // console.dir(context);
        assertNotNull(state, context);
        assert(transit.type === "external", context);
        transit = { type: "regular" };
        assert(state.suspension === "yield", context);
        state.suspension = "none";
        state.stack.push(value);
        return value;
      },
    };
    /* eslint-enable no-use-before-define */

    return { type: "standard", data: aspect };
  };

/** @type {import("../types").Stage} */
export default async (_argv) => {
  const exclusion = new Set(
    parseFailureArray(
      [
        await readFile(
          new URL("identity.failure.txt", import.meta.url),
          "utf8",
        ),
        await readFile(new URL("parsing.failure.txt", import.meta.url), "utf8"),
      ].join("\n"),
    ).map(getFailureTarget),
  );
  const negative = parseNegative(
    await readFile(new URL("bare.negative.txt", import.meta.url), "utf8"),
  );
  return {
    isExcluded: (target) => exclusion.has(target),
    predictStatus: (target) => getNegativeStatus(negative, target),
    listCause: (result) => listNegativeCause(negative, result.target),
    compileInstrument: ({ report, reject, record, warning, context }) =>
      setupAran(
        "basic",
        compileMakeAspect({
          AssertionError: compileAssertionError(report, false),
          UnreachableError: compileUnreachableError(report),
        }),
        {
          global_declarative_record: "builtin",
          initial: null,
          record,
          reject,
          context,
          warning,
        },
      ),
  };
};
