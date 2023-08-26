/* eslint-disable no-restricted-syntax */

import { StaticError, map } from "../util/index.mjs";

const {
  Symbol: { iterator },
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @type {<X>(entry: [X, unknown]) => [X, null]} */
const removeEntryValue = ([parameter, _node]) => [parameter, null];

/** @type {(any: any) => any is Iterable<any>} */
const isIterable = (any) => any != null && typeof any[iterator] === "function";

/** @type {(unknown: unknown) => null} */
const returnNull = (_unknown) => null;

/**
 * @type {<X1, Y>(
 *   f: ((x1: X1) => boolean) | boolean | undefined,
 *   x1: X1,
 * ) => boolean}
 */
export const cut1 = (f, x1) => (typeof f === "function" ? f(x1) : !!f);

/**
 * @type {<X1, X2, Y>(
 *   f: ((x1: X1, x2: X2) => boolean) | boolean | undefined,
 *   x1: X1,
 *   x2: X2,
 * ) => boolean}
 */
export const cut2 = (f, x1, x2) => (typeof f === "function" ? f(x1, x2) : !!f);

/**
 * @type {<X1, X2, X3, Y>(
 *   f: ((x1: X1, x2: X2, x3: X3) => boolean) | boolean | undefined,
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 * ) => boolean}
 */
export const cut3 = (f, x1, x2, x3) =>
  typeof f === "function" ? f(x1, x2, x3) : !!f;

/**
 * @type {<X1, X2, X3, X4, Y>(
 *   f: ((x1: X1, x2: X2, x3: X3, x4: X4) => boolean) | boolean | undefined,
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   x4: X4,
 * ) => boolean}
 */
export const cut4 = (f, x1, x2, x3, x4) =>
  typeof f === "function" ? f(x1, x2, x3, x4) : !!f;

/**
 * @type {<X1, X2, X3, X4, X5, Y>(
 *   f: ((x1: X1, x2: X2, x3: X3, x4: X4, x5: X5) => boolean) | boolean | undefined,
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 *   x4: X4,
 *   x5: X5,
 * ) => boolean}
 */
export const cut5 = (f, x1, x2, x3, x4, x5) =>
  typeof f === "function" ? f(x1, x2, x3, x4, x5) : !!f;

/**
 * @template X
 * @param {{static: X}} object
 * @returns {X}
 */
export const getStatic = ({ static: x }) => x;

/** @type {(pointcut: ObjectPointcut, point: Point) => boolean} */
const cutObject = (pointcut, point) => {
  switch (point.type) {
    case "eval.enter":
      return cut3(
        pointcut["eval.enter"],
        reduceEntry(map(listEntry(point.parameters), removeEntryValue)),
        map(point.variables, getStatic),
        point.serial.static,
      );
    case "eval.success":
      return cut2(pointcut["eval.success"], null, point.serial.static);
    case "eval.failure":
      return cut2(pointcut["eval.failure"], null, point.serial.static);
    case "eval.leave":
      return cut1(pointcut["eval.leave"], point.serial.static);
    case "module.enter":
      return cut4(
        pointcut["module.enter"],
        point.links,
        reduceEntry(map(listEntry(point.parameters), removeEntryValue)),
        map(point.variables, getStatic),
        point.serial.static,
      );
    case "module.success":
      return cut1(pointcut["module.success"], point.serial.static);
    case "module.failure":
      return cut2(pointcut["module.failure"], null, point.serial.static);
    case "module.leave":
      return cut1(pointcut["module.leave"], point.serial.static);
    case "script.before":
      return cut2(
        pointcut["script.before"],
        reduceEntry(map(listEntry(point.parameters), removeEntryValue)),
        point.serial.static,
      );
    case "script.after":
      return cut2(pointcut["script.after"], null, point.serial.static);
    case "closure.enter":
      return cut5(
        pointcut["closure.enter"],
        point.kind,
        null,
        reduceEntry(map(listEntry(point.parameters), removeEntryValue)),
        map(point.variables, getStatic),
        point.serial.static,
      );
    case "closure.failure":
      return cut2(pointcut["closure.failure"], null, point.serial.static);
    case "closure.success":
      return cut1(pointcut["closure.success"], point.serial.static);
    case "closure.leave":
      return cut1(pointcut["block.leave"], point.serial.static);
    case "block.enter":
      return cut5(
        pointcut["block.enter"],
        point.kind,
        reduceEntry(map(listEntry(point.parameters), removeEntryValue)),
        map(point.labels, getStatic),
        map(point.variables, getStatic),
        point.serial.static,
      );
    case "block.failure":
      return cut2(pointcut["block.failure"], null, point.serial.static);
    case "block.success":
      return cut1(pointcut["block.success"], point.serial.static);
    case "block.leave":
      return cut1(pointcut["block.leave"], point.serial.static);
    case "debugger.before":
      return cut1(pointcut["debugger.before"], point.serial.static);
    case "debugger.after":
      return cut1(pointcut["debugger.after"], point.serial.static);
    case "break.before":
      return cut2(
        pointcut["break.before"],
        point.label.static,
        point.serial.static,
      );
    case "return.before":
      return cut2(pointcut["return.before"], null, point.serial.static);
    case "parameter.after":
      return cut3(
        pointcut["parameter.after"],
        point.name,
        null,
        point.serial.static,
      );
    case "intrinsic.after":
      return cut3(
        pointcut["intrinsic.after"],
        point.name,
        null,
        point.serial.static,
      );
    case "primitive.after":
      return cut2(
        pointcut["primitive.after"],
        point.value,
        point.serial.static,
      );
    case "closure.after":
      return cut5(
        pointcut["closure.after"],
        point.kind,
        point.asynchronous,
        point.generator,
        null,
        point.serial.static,
      );
    case "read.after":
      return cut3(
        pointcut["read.after"],
        point.variable.static,
        null,
        point.serial.static,
      );
    case "write.before":
      return cut3(
        pointcut["write.before"],
        point.variable.static,
        null,
        point.serial.static,
      );
    case "test.before":
      return cut3(
        pointcut["test.before"],
        point.kind,
        null,
        point.serial.static,
      );
    case "import.after":
      return cut4(
        pointcut["import.after"],
        point.source,
        point.specifier,
        null,
        point.serial.static,
      );
    case "drop.before":
      return cut2(pointcut["drop.before"], null, point.serial.static);
    case "export.before":
      return cut3(
        pointcut["export.before"],
        point.specifier,
        null,
        point.serial.static,
      );
    case "conditional.before":
      return cut2(pointcut["conditional.before"], null, point.serial.static);
    case "conditional.after":
      return cut2(pointcut["conditional.after"], null, point.serial.static);
    case "eval.before":
      return cut2(pointcut["eval.before"], null, point.serial.static);
    case "eval.after":
      return cut2(pointcut["eval.after"], null, point.serial.static);
    case "await.before":
      return cut2(pointcut["await.before"], null, point.serial.static);
    case "await.after":
      return cut2(pointcut["await.after"], null, point.serial.static);
    case "yield.before":
      return cut3(
        pointcut["yield.before"],
        point.delegate,
        null,
        point.serial.static,
      );
    case "yield.after":
      return cut3(
        pointcut["yield.after"],
        point.delegate,
        null,
        point.serial.static,
      );
    case "apply":
      return cut4(
        pointcut.apply,
        null,
        null,
        map(point.arguments, returnNull),
        point.serial.static,
      );
    case "construct":
      return cut3(
        pointcut.construct,
        null,
        map(point.arguments, returnNull),
        point.serial.static,
      );
    case "enclave.read.before":
      return cut2(
        pointcut["enclave.read.before"],
        point.variable,
        point.serial.static,
      );
    case "enclave.read.after":
      return cut3(
        pointcut["enclave.read.after"],
        point.variable,
        null,
        point.serial.static,
      );
    case "enclave.typeof.before":
      return cut2(
        pointcut["enclave.typeof.before"],
        point.variable,
        point.serial.static,
      );
    case "enclave.typeof.after":
      return cut3(
        pointcut["enclave.typeof.after"],
        point.variable,
        null,
        point.serial.static,
      );
    case "enclave.write.before":
      return cut3(
        pointcut["enclave.write.before"],
        point.variable,
        null,
        point.serial.static,
      );
    case "enclave.write.after":
      return cut2(
        pointcut["enclave.write.after"],
        point.variable,
        point.serial.static,
      );
    case "enclave.declare.before":
      return cut4(
        pointcut["enclave.declare.before"],
        point.kind,
        point.variable,
        null,
        point.serial.static,
      );
    case "enclave.declare.after":
      return cut3(
        pointcut["enclave.declare.after"],
        point.kind,
        point.variable,
        point.serial.static,
      );
    default:
      throw new StaticError("invalid point", point);
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
    return pointcut;
  }
};
