/* eslint-disable no-restricted-syntax */

import { StaticError } from "../util/index.mjs";

const {
  Symbol: { iterator },
} = globalThis;

/** @type {(any: any) => any is Iterable<any>} */
const isIterable = (any) => any != null && typeof any[iterator] === "function";

/** @type {(pointcut: ObjectPointcut, point: Point) => boolean} */
const cutObject = (pointcut, point) => {
  if (typeof pointcut[point.type] !== "function") {
    return !!pointcut[point.type];
  } else {
    switch (point.type) {
      case "enter":
        return /** @type {function} */ (pointcut.enter)(
          point.frame,
          point.links,
          point.labels,
          point.variables,
          point.serial,
        );
      case "completion":
        return /** @type {function} */ (pointcut.completion)(
          point.frame,
          point.serial,
        );
      case "leave":
        return /** @type {function} */ (pointcut.leave)(
          point.frame,
          point.serial,
        );
      case "debugger":
        return /** @type {function} */ (pointcut.debugger)(point.serial);
      case "break":
        return /** @type {function} */ (pointcut.break)(
          point.label,
          point.serial,
        );
      case "read-external":
        return /** @type {function} */ (pointcut["read-external"])(
          point.variable,
          point.value,
          point.serial,
        );
      case "typeof-external":
        return /** @type {function} */ (pointcut["typeof-external"])(
          point.variable,
          point.value,
          point.serial,
        );
      case "parameter":
        return /** @type {function} */ (pointcut.parameter)(
          point.name,
          point.value,
          point.serial,
        );
      case "intrinsic":
        return /** @type {function} */ (pointcut.intrinsic)(
          point.name,
          point.value,
          point.serial,
        );
      case "primitive":
        return /** @type {function} */ (pointcut.primitive)(
          point.value,
          point.serial,
        );
      case "closure":
        return /** @type {function} */ (pointcut.closure)(
          point.kind,
          point.asynchronous,
          point.generator,
          point.value,
          point.serial,
        );
      case "read":
        return /** @type {function} */ (pointcut.read)(
          point.variable,
          point.value,
          point.serial,
        );
      case "write":
        return /** @type {function} */ (pointcut.write)(
          point.variable,
          point.value,
          point.serial,
        );
      case "import":
        return /** @type {function} */ (pointcut.import)(
          point.source,
          point.specifier,
          point.value,
          point.serial,
        );
      case "export":
        return /** @type {function} */ (pointcut.export)(
          point.specifier,
          point.value,
          point.serial,
        );
      case "eval":
        return /** @type {function} */ (pointcut.eval)(
          point.value,
          point.serial,
        );
      case "await":
        return /** @type {function} */ (pointcut.await)(
          point.value,
          point.serial,
        );
      case "yield":
        return /** @type {function} */ (pointcut.yield)(
          point.delegate,
          point.value,
          point.serial,
        );
      case "drop":
        return /** @type {function} */ (pointcut.drop)(
          point.value,
          point.serial,
        );
      case "test":
        return /** @type {function} */ (pointcut.test)(
          point.value,
          point.serial,
        );
      case "write-external":
        return /** @type {function} */ (pointcut["write-external"])(
          point.variable,
          point.value,
          point.serial,
        );
      case "declare-external":
        return /** @type {function} */ (pointcut["declare-external"])(
          point.kind,
          point.variable,
          point.value,
          point.serial,
        );
      case "interrupt":
        return /** @type {function} */ (pointcut.interrupt)(
          point.frame,
          point.value,
          point.serial,
        );
      case "return":
        return /** @type {function} */ (pointcut.return)(
          point.value,
          point.serial,
        );
      case "apply":
        return /** @type {function} */ (pointcut.apply)(
          point.callee,
          point.this,
          point.arguments,
          point.serial,
        );
      case "construct":
        return /** @type {function} */ (pointcut.construct)(
          point.callee,
          point.arguments,
          point.serial,
        );
      default:
        throw new StaticError("invalid point", point);
    }
  }
};

/** @type {(Pointcut: Pointcut, point: Point) => boolean} */
export const cut = (pointcut, point) => {
  if (typeof pointcut === "function") {
    return pointcut(point);
  } else if (typeof pointcut === "object" && pointcut !== null) {
    if (isIterable(pointcut)) {
      for (const item of pointcut) {
        if (item === point.type) {
          return true;
        }
      }
      return false;
    } else {
      return cutObject(pointcut, point);
    }
  } else {
    return !!pointcut;
  }
};
