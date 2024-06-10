/* eslint-disable no-use-before-define */

const {
  Array: { isArray },
  undefined,
  Reflect: { apply, construct },
  Error,
  Object: { is },
} = globalThis;

/**
 * @type {(
 *   value: import("./yo").Value,
 *   other: import("./yo").Value,
 * ) => boolean}
 */
const isIdentical = is;

import { readFile } from "node:fs/promises";
import {
  compileExpect,
  compileStandardInstrumentation,
} from "./util/index.mjs";
import {
  isClosureKind,
  isControlKind,
  isProgramKind,
} from "../../../lib/index.mjs";
import { AranTypeError } from "../error.mjs";

const { JSON, URL } = globalThis;

/** @type {import("./state").Call} */
const EXTERNAL_CALL = { type: "external" };

/** @type {test262.Stage} */
export default {
  requirement: ["identity", "parsing"],
  exclusion: [],
  expect: compileExpect(
    JSON.parse(
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
        reject(this);
      }
    }
    /* eslint-enable */

    /* eslint-disable */
    class UnreachableError extends Error {
      constructor(/** @type {never} */ data) {
        super("this should never happen");
        this.name = "UnreachableError";
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
     *   call: import("./yo").Call,
     * ) => asserts call is import("./yo").Call & { type: "internal"} }
     */
    const assertInternalCall = (call) => {
      assert(call.type === "internal");
    };

    /**
     * @type {(
     *   target: unknown,
     * ) => asserts target is import("./yo").Value[]}
     */
    const assertValueArray = (target) => {
      assert(isArray(target));
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
     *   target: unknown,
     * ) => asserts target is function}
     */
    const assertFunction = (target) => {
      assert(typeof target === "function");
    };

    /**
     * @type {(
     *   status: import("./state").Status,
     * ) => asserts status is import("./state").Status & { type: "throw" }}
     */
    const assertThrowStatus = (status) => {
      assert(status.type === "throw");
    };

    /**
     * @type {(
     *   target: import("./yo").Abrupt,
     * ) => asserts target is import("./yo").Abrupt & { type: "return" | "throw" }}
     */
    const assertExitAbrupt = (abrupt) => {
      assert(abrupt.type === "return" || abrupt.type === "throw");
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

    ////////////
    // Aspect //
    ////////////

    /** @type {import("./state").Call[]} */
    const callstack = [];

    /**
     * @type {import("../../../lib").StandardAspect<
     *   import("./state").Scope,
     *   import("./state").Valuation,
     * >}
     */
    const aspect = {
      "block@setup": (parent, kind, head, path) => ({
        kind,
        path,
        parent,
        labels: isControlKind(kind)
          ? /** @type {import("../../../lib").Label[]} */ (head)
          : [],
        frame: {},
        suspended: false,
      }),
      "block@frame": (state, kind, frame, path) => {
        assert(kind === state.kind);
        assert(path === state.path);
        assert(state.suspended === false);
        if (isProgramKind(kind) || isClosureKind(kind)) {
          const call = pop(callstack);
          if (call.type === "external") {
            callstack.push(call, {
              type: "ongoing",
              stack: [],
            });
          } else if (call.type === "apply") {
            assert(isClosureKind(kind));
            assert(
              "function.callee" in frame &&
                isIdentical(frame["function.callee"], call.callee),
            );
            assert(
              !("new.target" in frame) ||
                isIdentical(frame["new.target"], intrinsic.undefined),
            );
            assert(!("this" in frame) || isIdentical(frame.this, call.self));
            const input1 = call.input;
            const input2 = frame["function.arguments"];
            assert(input1.length === input2.length);
            const { length } = input1;
            for (const index = 0; index < length; index += 1) {
              assert(isIdentical(input1[index], input2[index]));
            }
          }
        } else if (!isControlKind(kind)) {
          throw new AranTypeError(kind);
        }
        state.frame = frame;
      },
      "block@success": (state, kind, value, path) => {
        assert(kind === state.kind);
        assert(path === state.path);
        assert(state.suspended === false);
        assert(state.status.type === "ongoing");
        state.status = { type: "completion" };
        return /** @type {any} */ (value);
      },
      "block@failure": (state, kind, value, path) => {
        assert(kind === state.kind);
        assert(path === state.path);
        if (state.suspended) {
          state.suspended = false;
          assert(state.status.type === "ongoing");
          state.status = { type: "throw", error: value };
        } else {
          assertThrowStatus(state.status);
          assert(state.status.error === value);
        }
        return value;
      },
      "block@teardown": (state, kind, path) => {
        assert(kind === state.kind);
        assert(path === state.path);
        assert(state.suspended === false);
        if (state.status.type === "setup" || state.status.type === "ongoing") {
          throw new AssertionError("missing termination");
        } else if (state.status.type === "throw") {
          assertThrowStatus(state.status);
        } else {
        }

        if (isProgramKind(kind)) {
        } else if (isClosureKind(kind)) {
          if (state.status.type === "ongoing")
            if (state.status.type === "throw") {
            }
        } else if (isControlKind(kind)) {
        } else {
          throw new AranTypeError(kind);
        }
      },
    };

    ////////////
    // Return //
    ////////////

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

/** @type {import("./yo").Advice<[]>} */
const _aran_state_ = {
  kind: "block@initialize",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "RoutineBlock" ? [] : null,
  behavior: (_parent) => ({
    type: "internal",
    abrupt: { type: "none" },
    scope: [],
    stack: [],
  }),
};

/** @type {import("./yo").Advice<["arrow" | "function"]>} */
const _aran_setup_closure_ = {
  kind: "block@frame",
  pointcut: (_path, _node, parent, _root) =>
    parent.type === "ClosureExpression" ? [parent.kind] : null,
  behavior: (call, frame, kind) => {
    const parent = peek(callstack);
    if (parent.type === "internal") {
      const { stack } = parent;
      const arguments_ = frame["function.arguments"];
      assertValueArray(arguments_);
      for (let index = arguments_.length - 1; index >= 0; index -= 1) {
        assert(isIdentical(arguments_[index], pop(stack)));
      }
      if (kind === "arrow") {
        assert(!("this" in frame));
        assert(!("new.target" in frame));
        pop(stack);
      } else if (kind === "function") {
        assert("this" in frame);
        assert("new.target" in frame);
        if (frame["new.target"]) {
          pop(stack);
        } else {
          assert(isIdentical(frame.this, pop(stack)));
        }
      } else {
        throw new UnreachableError(kind);
      }
      assert(isIdentical(frame["function.callee"], pop(stack)));
    }
    const callee = frame["function.callee"];
    assertFunction(callee);
    const closure = closures.get(callee);
    assertDefined(closure);
    call.scope.push(...closure.scope);
    callstack.push(call);
    return null;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_setup_catch_ = {
  kind: "block@frame",
  pointcut: (_path, node, parent, _root) =>
    parent.type === "TryStatement" && parent.catch === node ? [] : null,
  behavior: (call, frame) => {
    assert(call === peek(callstack));
    assertErrorAbrupt(call.abrupt);
    assert(isIdentical(call.abrupt.error, frame["catch.error"]));
    call.abrupt = { type: "none" };
    return null;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_setup_ = {
  kind: "block@frame",
  pointcut: (_path, _node, _parent, _root) => [],
  behavior: (call, frame) => {
    assert(call === peek(callstack));
    assertInternalCall(call);
    call.scope.push(frame);
    return null;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_restore_catch_ = {
  kind: "block@catch",
  pointcut: (_path, _node, _parent, _root) => [],
  behavior: (call, error) => {
    if (suspended.has(call)) {
      suspended.delete(call);
      callstack.push(call);
      call.abrupt = { type: "throw", error };
    }
    return error;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_restore_finally_ = {
  kind: "block@finally",
  pointcut: (_path, _node, _parent, _root) => [],
  behavior: (call) => {
    if (suspended.has(call)) {
      suspended.delete(call);
      callstack.push(call);
      // Return value of generators are not used
      call.abrupt = {
        type: "return",
        result: /** @type {import("./yo").Value} */ (
          /** @type {unknown} */ ("dummy")
        ),
      };
    }
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_teardown_ = {
  kind: "block@finally",
  pointcut: (_path, _node, _parent, _root) => [],
  behavior: (call) => {
    assert(call === peek(callstack));
    pop(call.scope);
  },
};

/** @type {import("./yo").Advice<[import("./yo").Label[]]>} */
const _aran_teardown_label_ = {
  kind: "block@finally",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "ControlBlock" && node.labels.length > 0
      ? [node.labels]
      : null,
  behavior: (call, labels) => {
    assert(call === peek(callstack));
    if (
      call.abrupt !== null &&
      call.abrupt.type === "break" &&
      labels.includes(call.abrupt.label)
    ) {
      call.abrupt = { type: "none" };
    }
  },
};

/** @type {import("./yo").Advice<[boolean, boolean]>} */
const _aran_teardown_closure_ = {
  kind: "block@finally",
  pointcut: (_path, _node, parent, _root) =>
    parent.type === "ClosureExpression"
      ? [parent.asynchronous, parent.generator]
      : null,
  behavior: (call, asynchronous, generator) => {
    assert(call === pop(callstack));
    const { abrupt } = call;
    assertExitAbrupt(abrupt);
    const parent = peek(callstack);
    if (parent.type === "internal" && !asynchronous && !generator) {
      if (abrupt.type === "return") {
        parent.stack.push(abrupt.result);
      } else if (abrupt.type === "throw") {
        parent.abrupt = abrupt;
      } else {
        throw new UnreachableError(abrupt.type);
      }
    }
  },
};

///////////////////
// Abrupt Aspect //
///////////////////

/** @type {import("./yo").Advice<[]>} */
const _aran_return_ = {
  kind: "expression@after",
  pointcut: (_path, _node, parent, _root) =>
    parent.type === "ReturnStatement" || parent.type === "RoutineBlock"
      ? []
      : null,
  behavior: (call, result) => {
    assert(call === peek(callstack));
    call.abrupt = { type: "return", result };
    return result;
  },
};

/** @type {import("./yo").Advice<[import("./yo").Label]>} */
const _aran_break_ = {
  kind: "statement@before",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "BreakStatement" ? [node.label] : null,
  behavior: (call, label) => {
    assert(call === peek(callstack));
    call.abrupt = { type: "break", label };
  },
};

//////////////////
// Scope Aspect //
//////////////////

/**
 * @type {import("./yo").Advice<[
 *   import("./yo").Parameter | import("./yo").Variable,
 * ]>}
 */
const _aran_write_ = {
  kind: "expression@after",
  pointcut: (_path, _node, parent, _root) =>
    parent.type === "WriteEffect" ? [parent.variable] : null,
  behavior: (call, value, variable) => {
    assert(call === peek(callstack));
    const { scope } = call;
    for (let index = scope.length - 1; index >= 0; index -= 1) {
      const frame = scope[index];
      if (variable in frame) {
        frame[variable] = value;
        return value;
      }
    }
    throw new AssertionError("Missing variable");
  },
};

/**
 * @type {import("./yo").Advice<[
 *   import("./yo").Parameter | import("./yo").Variable,
 * ]>}
 */
const _aran_read_ = {
  kind: "expression@after",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "ReadExpression" ? [node.variable] : null,
  behavior: (call, value, variable) => {
    assert(call === peek(callstack));
    const { scope } = call;
    for (let index = scope.length - 1; index >= 0; index -= 1) {
      const frame = scope[index];
      if (variable in frame) {
        assert(isIdentical(frame[variable], value));
        return value;
      }
    }
    throw new AssertionError("Missing variable");
  },
};

//////////////////
// Stack Aspect //
//////////////////

/** @type {import("./yo").Advice<[]>} */
const _aran_produce_ = {
  kind: "expression@after",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "PrimitiveExpression" ||
    node.type === "IntrinsicExpression" ||
    node.type === "ImportExpression" ||
    node.type === "ReadExpression" ||
    node.type === "ClosureExpression" ||
    node.type === "AwaitExpression" ||
    node.type === "YieldExpression"
      ? []
      : null,
  behavior: (call, value) => {
    assert(call === peek(callstack));
    call.stack.push(value);
    return value;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_consume_ = {
  kind: "expression@after",
  pointcut: (_path, node, parent, _root) =>
    parent.type === "IfStatement" ||
    parent.type === "WhileStatement" ||
    parent.type === "ReturnStatement" ||
    parent.type === "WriteEffect" ||
    parent.type === "ExportEffect" ||
    parent.type === "EvalExpression" ||
    (parent.type === "ConditionalExpression" && parent.test === node)
      ? []
      : null,
  behavior: (call, value) => {
    assert(call === peek(callstack));
    assert(isIdentical(value, pop(call.stack)));
    return value;
  },
};

//////////////////
// Other Aspect //
//////////////////

/** @type {import("./yo").Advice<["arrow" | "function", boolean, boolean]>} */
const _aran_register_ = {
  kind: "expression@after",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "ClosureExpression"
      ? [node.kind, node.asynchronous, node.generator]
      : null,
  behavior: (call, value, kind, asynchronous, generator) => {
    assert(call === peek(callstack));
    assertFunction(value);
    assert(!closures.has(value));
    closures.set(value, {
      kind,
      asynchronous,
      generator,
      scope: call.scope.slice(),
    });
    return value;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_apply_ = {
  kind: "apply@around",
  pointcut: (_path, _node, _parent, _root) => [],
  behavior: (call, callee, this_, arguments_) => {
    assert(call === peek(callstack));
    if (typeof callee === "function") {
      const closure = closures.get(callee);
      if (closure === undefined) {
        const { stack } = call;
        for (let index = arguments_.length; index >= 0; index -= 1) {
          assert(isIdentical(arguments_[index], pop(stack)));
        }
        assert(isIdentical(this_, pop(stack)));
        assert(isIdentical(callee, pop(stack)));
        callstack.push({ type: "external" });
        try {
          const result = apply(
            /** @type {function} */ (/** @type {unknown} */ (callee)),
            this_,
            arguments_,
          );
          call.stack.push(result);
          return result;
        } catch (error) {
          call.abrupt = {
            type: "throw",
            // eslint-disable-next-line object-shorthand
            error: /** @type {import("./yo").Value} */ (error),
          };
          throw error;
        } finally {
          assert(pop(callstack).type === "external");
          assert(peek(callstack) === call);
        }
      } else {
        const result = apply(callee, this_, arguments_);
        if (closure.asynchronous || closure.generator) {
          call.stack.push(result);
        }
        return result;
      }
    } else {
      const error = new intrinsic.TypeError("Not a function");
      call.abrupt = { type: "throw", error };
      throw error;
    }
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_construct_ = {
  kind: "construct@around",
  pointcut: (_path, _node, _parent, _root) => [],
  behavior: (call, callee, arguments_) => {
    assert(call === peek(callstack));
    if (typeof callee === "function") {
      const closure = closures.get(callee);
      if (closure === undefined) {
        const { stack } = call;
        for (let index = arguments_.length; index >= 0; index -= 1) {
          assert(isIdentical(arguments_[index], pop(stack)));
        }
        assert(isIdentical(callee, pop(stack)));
        callstack.push({ type: "external" });
        try {
          const result = construct(
            /** @type {function} */ (/** @type {unknown} */ (callee)),
            arguments_,
          );
          call.stack.push(result);
          assert(pop(callstack).type === "external");
          return result;
        } catch (error) {
          call.abrupt = {
            type: "throw",
            // eslint-disable-next-line object-shorthand
            error: /** @type {import("./yo").Value} */ (error),
          };
          throw error;
        }
      } else {
        if (
          closure.kind === "arrow" ||
          closure.asynchronous ||
          closure.generator
        ) {
          const error = new intrinsic.TypeError("Not a constructor");
          call.abrupt = { type: "throw", error };
          throw error;
        } else {
          return construct(callee, arguments_);
        }
      }
    } else {
      const error = new intrinsic.TypeError("Not a constructor");
      call.abrupt = { type: "throw", error };
      throw error;
    }
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_await_ = {
  kind: "expression@after",
  pointcut: (_path, _node, parent, _root) =>
    parent.type === "AwaitExpression" ? [] : null,
  behavior: (call, value) => {
    assert(call === peek(callstack));
    return /** @type {import("./yo").Value} */ (
      /** @type {unknown} */ (
        (async () => {
          try {
            const result = await value;
            call.stack.push(result);
            return result;
          } catch (error) {
            call.abrupt = {
              type: "throw",
              // eslint-disable-next-line object-shorthand
              error: /** @type {import("./yo").Value} */ (error),
            };
            throw error;
          } finally {
            callstack.push(call);
          }
        })()
      )
    );
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_before_yield_ = {
  kind: "expression@after",
  pointcut: (_path, _node, parent, _root) =>
    parent.type === "YieldExpression" ? [] : null,
  behavior: (call, value) => {
    assert(call === pop(callstack));
    assert(!suspended.has(call));
    suspended.add(call);
    return value;
  },
};

/** @type {import("./yo").Advice<[]>} */
const _aran_yield_ = {
  kind: "expression@after",
  pointcut: (_path, node, _parent, _root) =>
    node.type === "YieldExpression" ? [] : null,
  behavior: (call, value) => {
    assert(suspended.has(call));
    suspended.delete(call);
    callstack.push(call);
    return value;
  },
};
