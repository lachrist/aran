import {
  isClosureKind,
  isSegmentKind,
  isProgramKind,
} from "../../lib/index.mjs";

const {
  Array: { isArray },
  WeakMap,
  Object: { is, hasOwn, assign },
} = globalThis;

/**
 * @type {(
 *   value: import("./invariant").Value,
 *   other: import("./invariant").Value,
 * ) => boolean}
 */
const isIdentical = is;

/**
 * @type {(
 *   value: import("./invariant").Value
 * ) => value is import("./invariant").ArrayValue}
 */
const isArrayValue = /** @type {any} */ (isArray);

/**
 * @type {(
 *   report: {
 *     AssertionError: new (context: object) => Error,
 *     UnreachableError: new (data: never) => Error,
 *   },
 *   membrane: import("../262/aran/membrane").BasicMembrane,
 * ) => import("../../").StandardAdvice<
 *   import("../262/aran/config").NodeHash,
 *   import("./invariant").State,
 *   import("./invariant").Valuation,
 * >}
 */
export const makeInvariantAdvice = (
  { AssertionError, UnreachableError },
  { intrinsics, instrumentLocalEvalCode },
) => {
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
   * @type {WeakMap<Function, import("../../").AranClosureKind>}
   */
  const closures = new WeakMap();

  /**
   * @type {import("./invariant").Transit}
   */
  let transit = { type: "external" };

  /**
   * @type {import("../../").StandardAdvice<
   *   import("../262/aran/config").NodeHash,
   *   import("./invariant").State,
   *   import("./invariant").Valuation,
   * >}
   */
  const aspect = {
    // Block //
    "block@setup": (state, kind, hash) => {
      const context = { type: "block@setup", transit, state, kind, hash };
      // console.dir(context);
      if (isClosureKind(kind)) {
        assert(
          transit.type === "apply" ||
            transit.type === "construct" ||
            transit.type === "external",
          context,
        );
      } else if (isSegmentKind(kind)) {
        assert(
          transit.type === "regular" ||
            (transit.type === "throw" && kind === "catch") ||
            (transit.type === "throw" && kind === "finally") ||
            (transit.type === "break" && kind === "finally") ||
            (transit.type === "return-unknown" && kind === "finally"),
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
        hash,
        origin,
        scope: {},
        stack: [],
        labeling: [],
        suspension: "none",
      };
    },
    "segment-block@before": (state, kind, labels, hash) => {
      const context = {
        type: "control-block@labeling",
        transit,
        state,
        kind,
        labels,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
      // Labels comes from the target realm.
      // So it is subject to prototype polluation.
      // So `state.labeling.push(...labels)` is unsafe
      const { length } = labels;
      for (let index = 0; index < length; index += 1) {
        state.labeling.push(labels[index]);
      }
    },
    "block@declaration": (state, kind, frame, hash) => {
      const context = {
        type: "block@declaration",
        transit,
        state,
        kind,
        frame,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
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
            !isArrayValue(/** @type {import("./invariant").Value} */ (input1))
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
    "generator-block@suspension": (state, kind, hash) => {
      const context = {
        type: "generator-block@suspension",
        transit,
        state,
        kind,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
      assert(transit.type === "regular", context);
      state.suspension = "yield";
      if (state.origin.type === "apply" || state.origin.type === "construct") {
        transit = { type: "yield" };
        state.origin = { type: "external" };
      } else if (state.origin.type === "external") {
        transit = { type: "external" };
      } else if (
        state.origin.type === "return" ||
        state.origin.type === "return-unknown" ||
        state.origin.type === "completion" ||
        state.origin.type === "throw" ||
        state.origin.type === "break" ||
        state.origin.type === "regular" ||
        state.origin.type === "await" ||
        state.origin.type === "yield" ||
        state.origin.type === "eval"
      ) {
        throw new AssertionError(context);
      } else {
        throw new UnreachableError(state.origin);
      }
    },
    "generator-block@resumption": (state, kind, hash) => {
      const context = {
        type: "generator-block@resumption",
        transit,
        state,
        kind,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.suspension === "yield", context);
      state.suspension = "none";
      assert(transit.type === "external", context);
      transit = { type: "regular" };
    },
    "segment-block@after": (state, kind, hash) => {
      const context = {
        type: "control-block@completion",
        transit,
        state,
        kind,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
      assert(state.stack.length === 0, context);
      assert(transit.type === "regular", context);
      transit = { type: "completion" };
    },
    "program-block@after": (state, kind, value, hash) => {
      const context = {
        type: "program-block@completion",
        transit,
        state,
        kind,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
      assert(transit.type === "regular", context);
      transit = { type: "return", result: value };
      return value;
    },
    "closure-block@after": (state, kind, value, hash) => {
      const context = {
        type: "closure-block@completion",
        transit,
        state,
        kind,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
      assert(transit.type === "regular", context);
      transit = { type: "return", result: value };
      return value;
    },
    "block@throwing": (state, kind, value, hash) => {
      const context = {
        type: "block@throwing",
        transit,
        state,
        kind,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
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
    "block@teardown": (state, kind, hash) => {
      const context = { type: "block@teardown", transit, state, kind, hash };
      // console.dir(context);
      assertNotNull(state, context);
      assert(state.kind === kind, context);
      assert(state.hash === hash, context);
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
      } else if (
        transit.type === "return" ||
        transit.type === "throw" ||
        transit.type === "return-unknown"
      ) {
        if (state.origin.type === "external") {
          transit = { type: "external" };
        }
      } else if (transit.type === "external") {
        assert(state.suspension === "yield", context);
        state.suspension = "none";
        transit = { type: "return-unknown" };
      } else if (
        transit.type === "await" ||
        transit.type === "yield" ||
        transit.type === "regular" ||
        transit.type === "apply" ||
        transit.type === "construct" ||
        transit.type === "eval"
      ) {
        throw new AssertionError(context);
      } else {
        throw new UnreachableError(transit);
      }
    },
    // Call //
    "apply@around": (state, callee, this_, arguments_, hash) => {
      const context = {
        type: "apply@around",
        transit,
        state,
        callee,
        this_,
        arguments_,
        hash,
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
        const kind = /** @type {import("../../").AranClosureKind} */ (
          closures.get(/** @type {any} */ (callee))
        );
        assert(transit.type === "regular", state);
        transit = /** @type {import("./invariant").Transit} */ ({
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
        // console.dir(context);
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
            transit.type === "await" ||
              transit.type === "return" ||
              transit.type === "throw",
            context,
          );
        } else if (kind === "generator") {
          assert(transit.type === "yield", context);
        } else if (kind === "async-generator") {
          assert(transit.type === "yield" || transit.type === "throw", context);
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
            error: /** @type {import("./invariant").Value} */ (error),
          };
          throw error;
        }
      }
    },
    "construct@around": (state, callee, arguments_, hash) => {
      const context = {
        type: "construct@before",
        transit,
        state,
        callee,
        arguments_,
        hash,
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
        const kind = /** @type {import("../../").AranClosureKind} */ (
          closures.get(/** @type {any} */ (callee))
        );
        if (kind === "function") {
          assert(transit.type === "regular", state);
          transit = /** @type {import("./invariant").Transit} */ ({
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
        } else if (
          kind === "async-function" ||
          kind === "arrow" ||
          kind === "async-arrow" ||
          kind === "method" ||
          kind === "async-method" ||
          kind === "generator" ||
          kind === "async-generator"
        ) {
          const error = /** @type {import("./invariant").Value} */ (
            /** @type {unknown} */ (
              new intrinsics.TypeError("Not a constructor")
            )
          );
          assert(transit.type === "regular", context);
          transit = { type: "throw", error };
          throw error;
        } else {
          throw new UnreachableError(kind);
        }
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
            error: /** @type {import("./invariant").Value} */ (error),
          };
          throw error;
        }
      }
    },
    // Abrupt //
    "break@before": (state, label, hash) => {
      const context = { type: "break@before", transit, state, label, hash };
      // console.dir(context);
      assertNotNull(state, context);
      assert(transit.type === "regular", context);
      transit = {
        type: "break",
        label,
      };
    },
    // Produce //
    "primitive@after": (state, value, hash) => {
      const context = {
        type: "primitive@after",
        transit,
        state,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      state.stack.push(value);
      return value;
    },
    "intrinsic@after": (state, name, value, hash) => {
      const context = {
        type: "intrinsic@after",
        transit,
        state,
        name,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(
        name in intrinsics &&
          isIdentical(
            /** @type {import("./invariant").Value} */ (intrinsics[name]),
            value,
          ),
        context,
      );
      state.stack.push(value);
      return value;
    },
    "import@after": (state, specifier, source, value, hash) => {
      const context = {
        type: "import@after",
        transit,
        state,
        specifier,
        source,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      state.stack.push(value);
      return value;
    },
    "read@after": (state, variable, value, hash) => {
      const context = {
        type: "read@after",
        transit,
        state,
        variable,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      /** @type {import("./invariant").State | null} */
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
    "closure@after": (state, kind, value, hash) => {
      const context = {
        type: "closure@after",
        transit,
        state,
        kind,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(!closures.has(value), context);
      closures.set(value, kind);
      state.stack.push(value);
      return value;
    },
    // Consume //
    "test@before": (state, kind, value, hash) => {
      const context = {
        type: "test@before",
        transit,
        state,
        kind,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      return !!value;
    },
    "write@before": (state, variable, value, hash) => {
      const context = {
        type: "write@before",
        transit,
        state,
        variable,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      /** @type {import("./invariant").State | null} */
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
    "export@before": (state, specifier, value, hash) => {
      const context = {
        type: "export@before",
        transit,
        state,
        specifier,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      return value;
    },
    "drop@before": (state, value, hash) => {
      const context = { type: "drop@before", transit, state, value, hash };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      return value;
    },
    // Jump //
    "eval@before": (state, reboot, value, hash) => {
      const context = {
        type: "eval@before",
        transit,
        state,
        reboot,
        value,
        hash,
      };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      if (typeof value === "string") {
        assert(state.suspension === "none", context);
        state.suspension = "eval";
        assert(transit.type === "regular", context);
        transit = { type: "external" };
        return instrumentLocalEvalCode(value, reboot);
      } else {
        transit = { type: "eval" };
        return value;
      }
    },
    "eval@after": (state, value, hash) => {
      const context = { type: "eval@after", transit, state, value, hash };
      // console.dir(context);
      assertNotNull(state, context);
      if (transit.type === "external") {
        assert(state.suspension === "eval", context);
        state.suspension = "none";
      } else if (transit.type === "eval") {
        // noop //
      } else {
        throw new AssertionError(context);
      }
      transit = { type: "regular" };
      state.stack.push(value);
      return value;
    },
    "await@before": (state, value, hash) => {
      const context = { type: "await@before", transit, state, value, hash };
      // console.dir(context);
      assertNotNull(state, context);
      assert(isIdentical(pop(state.stack, context), value), context);
      assert(transit.type === "regular", context);
      let current = state;
      while (isSegmentKind(current.kind)) {
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
    "await@after": (state, value, hash) => {
      const context = { type: "await@after", transit, state, value, hash };
      // console.dir(context);
      assertNotNull(state, context);
      assert(transit.type === "external", context);
      transit = { type: "regular" };
      assert(state.suspension === "await", context);
      state.suspension = "none";
      state.stack.push(value);
      return value;
    },
    "yield@before": (state, delegate, value, hash) => {
      const context = {
        type: "yield@before",
        transit,
        state,
        delegate,
        value,
        hash,
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
    "yield@after": (state, delegate, value, hash) => {
      const context = {
        type: "yield@after",
        transit,
        state,
        delegate,
        value,
        hash,
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

  return aspect;
};
