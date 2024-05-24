import { readFile } from "node:fs/promises";
import { compileExpect, compileCompileAranInstrument } from "./util/index.mjs";
import * as path from "node:path";
import { reduce } from "../../../lib/util/array.mjs";

const {
  undefined,
  JSON,
  URL,
  console: { dir },
  WeakMap,
  Reflect: { getPrototypeOf },
  Object: { hasOwn, is },
} = globalThis;

/**
 * @type {(
 *   value: import("./invariant-native").Value,
 *   other: (
 *     | import("./invariant-native").Value
 *     | import("./invariant-native").TargetPath
 *   ),
 * ) => boolean}
 */
const isSameValue = is;

/**
 * @type {<S extends string>(
 *   node: unknown,
 *   path: S,
 *   root: unknown,
 * ) => { point: [path: S], cut: boolean }}
 */
const pointcutDefault = (_node, path, _root) => ({ point: [path], cut: true });

/**
 * @type {(
 *   path: import("./invariant-native").TargetPath,
 *   root: aran.Program<import("./invariant-native").Atom>,
 * ) => aran.Node<import("./invariant-native").Atom>}
 */
const getParent = (_path, _root) => TODO;

/**
 * @type {import("./invariant-native").Pointcut}
 */
const pointcut = {
  // Block //
  RoutineBlock: (_node, path, root) => {
    /** @type {aran.Node<aran.Atom>} */
    const parent = getParent(path, root);
    if (parent.type === "ClosureExpression") {
      return { point: [path, "closure"], cut: true };
    } else if (parent.type === "Program") {
      if (parent.kind === "module" || parent.kind === "script") {
        return {
          point: [path, `${parent.kind}.${parent.situ}`],
          cut: true,
        };
      } else if (parent.kind === "eval") {
        return {
          point: [path, `${parent.kind}.${parent.situ}`],
          cut: true,
        };
      } else {
        throw new Error("Unexpected parent");
      }
    } else {
      throw new Error("Unexpected parent");
    }
  },
  ControlBlock: ({ labels }, path, _root) => ({
    point: [path, labels],
    cut: true,
  }),
  // Statement //
  BreakStatement: ({ label }, path, _root) => ({
    point: [path, label],
    cut: true,
  }),
  IfStatement: pointcutDefault,
  DebuggerStatement: pointcutDefault,
  BlockStatement: pointcutDefault,
  WhileStatement: pointcutDefault,
  TryStatement: pointcutDefault,
  ReturnStatement: pointcutDefault,
  EffectStatement: pointcutDefault,
  // Effect //
  WriteEffect: ({ variable }, path, _root) => ({
    point: [path, variable],
    cut: true,
  }),
  ExportEffect: pointcutDefault,
  ExpressionEffect: pointcutDefault,
  ConditionalEffect: pointcutDefault,
  // Expression //
  ImportExpression: pointcutDefault,
  IntrinsicExpression: ({ intrinsic }, path, _root) => ({
    point: [path, intrinsic],
    cut: true,
  }),
  EvalExpression: pointcutDefault,
  AwaitExpression: (_node, path, _root) => ({
    point: [path, {}],
    cut: true,
  }),
  YieldExpression: (_node, path, _root) => ({
    point: [path, {}],
    cut: true,
  }),
  ConditionalExpression: pointcutDefault,
  SequenceExpression: pointcutDefault,
  PrimitiveExpression: ({ primitive }, path, _root) => ({
    point: [path, primitive],
    cut: true,
  }),
  ReadExpression: ({ variable }, path, _root) => ({
    point: [path, variable],
    cut: true,
  }),
  ClosureExpression: pointcutDefault,
  ApplyExpression: pointcutDefault,
  ConstructExpression: pointcutDefault,
};

/** @type {import("./invariant-native").Status} */
const INITIAL_STATUS = { type: "initial" };

/** @type {import("./invariant-native").Status} */
const COMPLETION_STATUS = { type: "completion" };

/** @type {import("./invariant-native").Status} */
const RETURN_STATUS = { type: "return" };

/** @type {import("./invariant-native").Status} */
const FAILURE_STATUS = { type: "failure" };

/** @type {import("./invariant-native").Status} */
const ROOT_STATUS = { type: "root" };

/** @type {import("./invariant-native").Scope} */
const ROOT_SCOPE = {
  "invariant.status": ROOT_STATUS,
  "invariant.stack": 0,
};

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
      /* eslint-disable */
      class InvariantError extends Error {
        constructor(/** @type {string} */ message) {
          super(message);
          this.name = "InvariantError";
          dir(
            { callstack, scope, stack, scopes },
            { depth: 5, showHidden: true },
          );
          reject(this);
        }
      }
      /* eslint-enable */

      /**
       * @type {(
       *   parent: import("./invariant-native").Scope | null,
       *   invariant: {
       *     "invariant.status": import("./invariant-native").Status,
       *     "invariant.stack": number,
       *   },
       *   frame: { [K in string] ?: import("./invariant-native").Value},
       * ) => import("./invariant-native").Scope}
       */
      const extendScope = (parent, record, invariant) =>
        /** @type {any} */ ({
          __proto__: parent,
          ...record,
          ...invariant,
        });

      /**
       * @type {(
       *   scope: import("./invariant-native").Scope,
       * ) =>  import("./invariant-native").Scope}
       */
      const reduceScope = (scope) => {
        const parent = getPrototypeOf(scope);
        if (parent === null) {
          throw new InvariantError("Cannot remove root scope");
        } else {
          return /** @type {import("./invariant-native").Scope} */ (parent);
        }
      };

      /**
       * @type {(
       *   test: boolean,
       * ) => void}
       */
      const assert = (test) => {
        if (!test) {
          throw new InvariantError("Assertion failure");
        }
      };

      /**
       * @type {(data: never) => Error}
       */
      const unreachable = (_data) => new InvariantError("unreachable error");

      /**
       * @type {<X>(
       *   array: X[],
       * ) => X}
       */
      const pop = (array) => {
        if (array.length === 0) {
          throw new InvariantError("Cannot pop value from empty array");
        } else {
          return /** @type {any} */ (array.pop());
        }
      };

      /**
       * @type {<X>(
       *   array: X[],
       *   item: X,
       * ) => void}
       */
      const push = (array, item) => {
        array.push(item);
      };

      /**
       * @type {<X>(
       *   array: X[],
       * ) => X}
       */
      const peek = (array) => {
        if (array.length === 0) {
          throw new InvariantError("Cannot peek value on empty array");
        } else {
          return array[array.length - 1];
        }
      };

      /** @type {import("./invariant-native").Scope[]} */
      let callstack = [];

      /** @type {import("./invariant-native").Scope} */
      let scope = ROOT_SCOPE;

      /**
       * @type {(
       *   | import("./invariant-native").TargetPath
       *   | import("./invariant-native").Value
       * )[]}
       */
      let stack = [];

      /**
       * @type {WeakMap<Function, import("./invariant-native").Scope>}
       */
      const scopes = new WeakMap();

      /**
       * @type {(
       *   kind: "try" | "catch" | "finally" | "other",
       *   labels: import("./invariant-native").Label[],
       *   status: import("./invariant-native").Status,
       *   parent_status: import("./invariant-native").Status,
       * ) => import("./invariant-native").Status}
       */
      const updateParentStatus = (kind, labels, status, parent_status) => {
        if (kind === "finally") {
          assert(
            parent_status.type === "initial" ||
              parent_status.type === "failure",
          );
        } else if (kind === "try" || kind === "catch" || kind === "other") {
          assert(parent_status.type === "initial");
        } else {
          throw unreachable(kind);
        }
        if (status.type === "break") {
          return labels.includes(status.label) ? parent_status : status;
        } else if (status.type === "return") {
          return status;
        } else if (status.type === "failure") {
          if (kind === "try") {
            return parent_status;
          } else if (
            kind === "catch" ||
            kind === "finally" ||
            kind === "other"
          ) {
            return status;
          } else {
            throw unreachable(kind);
          }
        } else if (status.type === "completion") {
          return parent_status;
        } else if (status.type === "initial" || status.type === "root") {
          throw new InvariantError("unexpected initial|root status");
        } else {
          throw unreachable(status);
        }
      };

      /** @type {import("./invariant-native").Advice} */
      const advice = {
        // Block //
        "ControlBlock.before": (frame, path, _kind, _labels) => {
          push(stack, path);
          assert(scope["invariant.status"].type === "initial");
          scope = extendScope(
            scope,
            {
              "invariant.status": { type: "initial" },
              "invariant.stack": stack.length,
            },
            frame,
          );
          return frame;
        },
        "ControlBlock.after": (path, _kind, _labels) => {
          assert(path === peek(stack));
          assert(scope["invariant.stack"] === stack.length);
          assert(scope["invariant.status"].type === "initial");
          scope["invariant.status"] = { type: "completion" };
        },
        "ControlBlock.catch": (error, path, _kind, _labels) => {
          assert(scope["invariant.status"].type === "initial");
          assert(scope["invariant.stack"] <= stack.length);
          scope["invariant.status"] = { type: "failure" };
          stack.length = scope["invariant.stack"];
          assert(path === peek(stack));
          return error;
        },
        "ControlBlock.finally": (path, kind, labels) => {
          assert(scope["invariant.stack"] === stack.length);
          assert(path === pop(stack));
          const status = scope["invariant.status"];
          scope = reduceScope(scope);
          scope["invariant.status"] = updateParentStatus(
            kind,
            labels,
            status,
            scope["invariant.status"],
          );
        },
        "RoutineBlock.before": (frame, path, kind) => {
          push(stack, path);
          if (kind === "eval.local.deep") {
            assert(scope["invariant.status"].type === "initial");
          } else if (
            kind === "script.global" ||
            kind === "module.global" ||
            kind === "eval.global" ||
            kind === "eval.local.root"
          ) {
            assert(scope["invariant.status"].type === "root");
          } else if (kind === "closure") {
            assert(scope["invariant.status"].type === "root");
            const callee = frame["function.callee"];
            if (typeof callee !== "function") {
              throw new InvariantError("missing function.callee");
            }
            const closure_scope = scopes.get(callee);
            if (closure_scope === undefined) {
              throw new InvariantError("missing closure scope");
            }
            scope = closure_scope;
          } else {
            throw unreachable(kind);
          }
          scope = extendScope(
            scope,
            {
              "invariant.status": { type: "initial" },
              "invariant.stack": stack.length,
            },
            frame,
          );
          return frame;
        },
        "RoutineBlock.after": (path, _kind) => {
          assert(path === peek(stack));
          assert(scope["invariant.stack"] === stack.length);
          assert(scope["invariant.status"].type === "initial");
          scope["invariant.status"] = { type: "completion" };
        },
        "RoutineBlock.catch": (error, path, _kind) => {
          assert(scope["invariant.status"].type === "initial");
          assert(scope["invariant.stack"] <= stack.length);
          scope["invariant.status"] = { type: "failure" };
          stack.length = scope["invariant.stack"];
          assert(path === peek(stack));
          return error;
        },
        "RoutineBlock.finally": (path, kind) => {
          assert(scope["invariant.stack"] === stack.length);
          assert(path === pop(stack));
          const status = scope["invariant.status"];
          if (kind === "closure") {
            assert(
              status.type === "completion" ||
                status.type === "failure" ||
                status.type === "return",
            );
            scope = ROOT_SCOPE;
          } else if (kind === "eval.local.deep") {
            assert(status.type === "completion" || status.type === "failure");
            scope = reduceScope(scope);
          } else if (
            kind === "script.global" ||
            kind === "module.global" ||
            kind === "eval.global" ||
            kind === "eval.local.root"
          ) {
            assert(status.type === "completion" || status.type === "failure");
            scope = ROOT_SCOPE;
          } else {
            throw unreachable(kind);
          }
        },
        // Statement //
        "DebuggerStatement.before": (path) => {
          push(stack, path);
        },
        "DebuggerStatement.after": (path) => {
          assert(path === pop(stack));
        },
        "BreakStatement.before": (_path, label) => {
          assert(scope["invariant.status"].type === "initial");
          scope["invariant.status"] = { type: "break", label };
        },
        "IfStatement.before": (test, path) => {
          assert(isSameValue(test, pop(stack)));
          push(stack, path);
          return !!test;
        },
        "IfStatement.after": (path) => {
          assert(path === pop(stack));
        },
        "ReturnStatement.before": (completion, path) => {
          assert(isSameValue(completion, pop(stack)));
          assert(scope["invariant.status"].type === "initial");
          scope["invariant.status"] = RETURN_STATUS;
          return completion;
        },
        "EffectStatement.before": (path) => {
          push(stack, path);
        },
        "EffectStatement.after": (drop, path) => {},

        "intrinsic.after": (name, value, _location) => {
          assert(hasOwn(intrinsic, name));
          assert(isSameValue(value, intrinsic[name]));
          push(stack, value);
          return /** @type {import("./invariant-native").Value} */ (value);
        },
        "primitive.after": (value, location) => {
          push(stack, value);
          return /** @type {import("./invariant-native").Value} */ (value);
        },
        "import.after": (_source, _specifier, value, _location) => value,
        "closure.after": (kind, asynchronous, generator, value, location) => {
          if (scope === null) {
            throw new InvariantError("null scope");
          }
          assert(!scopes.has(value));
          scopes.set(value, scope);
          push(stack, value);
          return value;
        },
        "read.after": (variable, value, location) => {
          if (!(variable in scope)) {
            throw new InvariantError("missing variable in scope");
          }
          assert(isIdentical(value, scope[variable]));
          push(stack, value);
          return value;
        },
        "eval.before": (value, context, location) => {
          assert(isIdentical(value, pop(stack)));
          push(stack, location);
          if (typeof value === "string") {
            return instrument(value, context, location);
          } else {
            return intrinsic.undefined;
          }
        },
        "eval.after": (value, location) => {
          assert(isIdentical(location, pop(stack)));
          push(stack, value);
        },
        "await.before": (value, _location) => TODO,
        "await.after": (value, _location) => TODO,
        "yield.before": (_delegate, value, _location) => TODO,
        "yield.after": (_delegate, value, _location) => TODO,
        "drop.before": (value, _location) => {
          assert(isIdentical(value, pop(stack)));
        },
        "export.before": (_specifier, value, _location) => {
          assert(isIdentical(value, pop(stack)));
          return value;
        },
        "write.before": (variable, value, _location) => {
          if (scope === null) {
            throw new InvariantError("null scope");
          }
          assert(isIdentical(value, pop(stack)));
          assert(variable in scope);
          scope[variable] = value;
          return value;
        },
        "return.before": (value, _location) => {
          assert(isIdentical(value, pop(stack)));
          if (scope === null) {
            throw new InvariantError("null scope");
          }
          assert(scope["invariant.status"].type === "initial");
          scope["invariant.status"] = { type: "return" };
          return value;
        },
        "apply": (function_, this_, arguments_, _location) => {
          for (let index = arguments_.length; index >= 0; index -= 1) {
            assert(isIdentical(arguments_[index], pop(stack)));
          }
          assert(isIdentical(this_, pop(stack)));
          assert(isIdentical(function_, pop(stack)));
          push(callstack, scope);
          scope = null;
          try {
            push(
              stack,
              intrinsic["Reflect.apply"](
                /** @type {Function} */ (/** @type {unknown} */ (function_)),
                this_,
                arguments_,
              ),
            );
            return peek(stack);
          } catch (error) {
            if (scope === null) {
              throw new InvariantError("null scope");
            }
            assert(scope["invariant.status"].type === "initial");
            scope["invariant.status"] = { type: "failure", error };
            throw error;
          } finally {
            scope = pop(callstack);
          }
        },
        "construct": (constructor_, arguments_, _location) => {
          for (let index = arguments_.length; index >= 0; index -= 1) {
            assert(isIdentical(arguments_[index], pop(stack)));
          }
          assert(isIdentical(constructor_, pop(stack)));
          push(callstack, scope);
          scope = null;
          try {
            push(
              stack,
              intrinsic["Reflect.construct"](
                /** @type {Function} */ (/** @type {unknown} */ (constructor_)),
                arguments_,
              ),
            );
            return peek(stack);
          } catch (error) {
            if (scope === null) {
              throw new InvariantError("null scope");
            }
            assert(scope["invariant.status"].type === "initial");
            scope["invariant.status"] = { type: "failure", error };
            throw error;
          } finally {
            scope = pop(callstack);
          }
        },
      };
      return advice;
    },
    { global_declarative_record: "native" },
  ),
};
