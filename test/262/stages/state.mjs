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
  ROOT_PATH,
} from "../../../lib/index.mjs";

const {
  Set,
  URL,
  Array: { isArray },
  Error,
  WeakMap,
  Reflect: { getPrototypeOf, defineProperty },
  Object: { is, hasOwn },
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
     *   data: object,
     * ) => void}
     */
    const assert = (test, data) => {
      if (!test) {
        throw new AssertionError(data);
      }
    };

    /**
     * @type {<X>(
     *   array: X[],
     * ) => X}
     */
    const pop = (array) => {
      assert(array.length > 0, array);
      return /** @type {any} */ (array.pop());
    };

    /**
     * @type {(
     *   kind: import("../../../lib").BlockKind,
     *   type: import("./state").Transit["type"],
     * ) => boolean}
     */
    const isTransitValid = (kind, type) => {
      if (isControlKind(kind)) {
        return (
          type === "regular" ||
          (type === "throw" && kind === "catch") ||
          (type === "throw" && kind === "finally") ||
          (type === "break" && kind === "finally")
        );
      } else if (isClosureKind(kind)) {
        return type === "apply" || type === "construct" || type === "external";
      } else if (isProgramKind(kind)) {
        return type === "external";
      } else {
        throw new UnreachableError(kind);
      }
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
        const context = { transit, state, kind, path };
        assert(isTransitValid(kind, transit.type), context);
        const origin = transit;
        transit = { type: "regular" };
        return {
          kind,
          path,
          suspension: "none",
          scope: {
            __proto__: state.scope,
          },
          stack: [],
          labels: [],
          origin,
        };
      },
      "control-block@labeling": (state, kind, labels, path) => {
        const context = { transit, state, kind, labels, path };
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        state.labels.push(...labels);
      },
      "block@declaration": (state, kind, frame, path) => {
        const context = { transit, state, kind, frame, path };
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
        const descriptor = {
          __proto__: null,
          value: /** @type {any} */ (null),
          writable: true,
          enumerable: true,
          configurable: true,
        };
        for (const variable in frame) {
          descriptor.value = frame[/** @type {any} */ (variable)];
          defineProperty(state.scope, variable, descriptor);
        }
      },
      "generator-block@suspension": (state, kind, path) => {
        const context = { transit, state, kind, path };
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(transit.type === "regular", context);
        if (
          state.origin.type === "apply" ||
          state.origin.type === "construct"
        ) {
          state.origin = { type: "external" };
          transit = { type: "yield" };
        } else if (state.origin.type === "external") {
          transit = { type: "external" };
        } else if (
          state.origin.type === "await" ||
          state.origin.type === "yield" ||
          state.origin.type === "throw" ||
          state.origin.type === "break" ||
          state.origin.type === "regular" ||
          state.origin.type === "completion" ||
          state.origin.type === "return"
        ) {
          throw new AssertionError(context);
        } else {
          throw new UnreachableError(state.origin);
        }
      },
      "generator-block@resumption": (state, kind, path) => {
        const context = { transit, state, kind, path };
        assert(transit.type === "external", context);
        transit = { type: "regular" };
      },
      "control-block@completion": (state, kind, path) => {
        const context = { transit, state, kind, path };
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(state.stack.length === 0, context);
        assert(transit.type === "regular", context);
        transit = { type: "completion" };
      },
      "routine-block@completion": (state, kind, value, path) => {
        const context = { transit, state, kind, value, path };
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(transit.type === "regular", context);
        transit = { type: "return", result: value };
        return value;
      },
      "block@throwing": (state, kind, value, path) => {
        const context = { transit, state, kind, value, path };
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
        const context = { transit, state, kind, path };
        assert(state.kind === kind, context);
        assert(state.path === path, context);
        assert(state.stack.length === 0, context);
        if (transit.type === "break") {
          if (state.labels.includes(transit.label)) {
            transit = { type: "regular" };
          }
        } else if (transit.type === "return") {
          if (state.origin.type === "external") {
            transit = { type: "external" };
          }
        } else if (transit.type === "completion") {
          transit = { type: "regular" };
        } else if (transit.type === "throw") {
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
        const context = { transit, state, callee, this_, arguments_, path };
        for (let index = arguments_.length - 1; index >= 0; index -= 1) {
          assert(isIdentical(arguments_[index], pop(state.stack)), context);
        }
        assert(isIdentical(this_, pop(state.stack)), context);
        assert(isIdentical(callee, pop(state.stack)), context);
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
            assert(transit.type === "external", context);
            transit = { type: "regular" };
            state.stack.push(result);
            return result;
          } catch (error) {
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
        const context = { transit, state, callee, arguments_, path };
        for (let index = arguments_.length - 1; index >= 0; index -= 1) {
          assert(isIdentical(arguments_[index], pop(state.stack)), context);
        }
        assert(isIdentical(callee, pop(state.stack)), { callee, state });
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
          assert(
            transit.type === "return" && transit.result === result,
            context,
          );
          return result;
        } else {
          try {
            assert(transit.type === "regular", context);
            transit = { type: "external" };
            const result = intrinsics["Reflect.construct"](
              /** @type {any} */ (callee),
              arguments_,
            );
            assert(transit.type === "external", context);
            transit = { type: "regular" };
            state.stack.push(result);
            return result;
          } catch (error) {
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
        const context = { transit, state, label, path };
        assert(transit.type === "regular", context);
        transit = {
          type: "break",
          label,
        };
      },
      // Produce //
      "primitive@after": (state, value, _path) => {
        state.stack.push(value);
        return value;
      },
      "intrinsic@after": (state, name, value, path) => {
        const context = { transit, state, name, value, path };
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
      "import@after": (state, _specifier, _source, value, _path) => {
        state.stack.push(value);
        return value;
      },
      "read@after": (state, variable, value, path) => {
        const context = { transit, state, variable, value, path };
        assert(
          variable in state.scope &&
            isIdentical(/** @type {any} */ (state.scope)[variable], value),
          context,
        );
        state.stack.push(value);
        return value;
      },
      "closure@after": (state, kind, value, path) => {
        const context = { transit, state, kind, value, path };
        assert(!closures.has(value), context);
        closures.set(value, kind);
        state.stack.push(value);
        return value;
      },
      // Consume //
      "test@before": (state, kind, value, path) => {
        const context = { transit, state, kind, value, path };
        assert(isIdentical(pop(state.stack), value), context);
        return !!value;
      },
      "write@before": (state, variable, value, path) => {
        const context = { transit, state, variable, value, path };
        assert(isIdentical(pop(state.stack), value), context);
        let scope = state.scope;
        while (!hasOwn(scope, variable)) {
          const parent = /** @type {import("./state").Scope | null} */ (
            getPrototypeOf(scope)
          );
          if (parent === null) {
            throw new AssertionError(context);
          }
          scope = parent;
        }
        /** @type {any} */ (scope)[variable] = value;
        return value;
      },
      "export@before": (state, specifier, value, path) => {
        const context = { transit, state, specifier, value, path };
        assert(isIdentical(pop(state.stack), value), context);
        return value;
      },
      "drop@before": (state, value, path) => {
        const context = { transit, state, value, path };
        assert(isIdentical(pop(state.stack), value), context);
        return value;
      },
      // Jump //
      "eval@before": (state, reboot, value, path) => {
        const context = { transit, state, reboot, value, path };
        assert(isIdentical(pop(state.stack), value), context);
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
        const context = { transit, state, value, path };
        assert(transit.type === "external", context);
        transit = { type: "regular" };
        assert(state.suspension === "eval", context);
        state.suspension = "none";
        return value;
      },
      "await@before": (state, value, path) => {
        const context = { transit, state, value, path };
        assert(transit.type === "regular", context);
        if (state.origin.type === "external") {
          transit = { type: "external" };
        } else {
          transit = { type: "await" };
          state.origin = { type: "external" };
        }
        assert(state.suspension === "none", context);
        state.suspension = "await";
        return value;
      },
      "await@after": (state, value, path) => {
        const context = { transit, state, value, path };
        assert(transit.type === "external", context);
        transit = { type: "regular" };
        assert(state.suspension === "await", context);
        state.suspension = "none";
        return value;
      },
      "yield@before": (state, delegate, value, path) => {
        const context = { transit, state, delegate, value, path };
        assert(transit.type === "regular", context);
        transit = { type: "external" };
        assert(state.suspension === "none", context);
        state.suspension = "yield";
        return value;
      },
      "yield@after": (state, delegate, value, path) => {
        const context = { transit, state, delegate, value, path };
        assert(transit.type === "external", context);
        transit = { type: "regular" };
        assert(state.suspension === "yield", context);
        state.suspension = "none";
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
          initial: {
            kind: "root",
            suspension: "none",
            origin: { type: "external" },
            path: ROOT_PATH,
            scope: /** @type {any} */ (null),
            labels: [],
            stack: [],
          },
          record,
          reject,
          context,
          warning,
        },
      ),
  };
};
