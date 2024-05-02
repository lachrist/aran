import { map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";

const {
  Symbol: { iterator },
  Object: { entries: listEntry, fromEntries: reduceEntry },
} = globalThis;

/** @type {(any: any) => any is Iterable<any>} */
const isIterable = (any) => any != null && typeof any[iterator] === "function";

/** @type {(unknown: unknown) => null} */
const returnNull = (_unknown) => null;

/**
 * @type {<X1>(
 *   f: ((x1: X1) => boolean) | boolean | undefined,
 *   x1: X1,
 * ) => boolean}
 */
export const cut1 = (f, x1) => (typeof f === "function" ? f(x1) : !!f);

/**
 * @type {<X1, X2>(
 *   f: ((x1: X1, x2: X2) => boolean) | boolean | undefined,
 *   x1: X1,
 *   x2: X2,
 * ) => boolean}
 */
export const cut2 = (f, x1, x2) => (typeof f === "function" ? f(x1, x2) : !!f);

/**
 * @type {<X1, X2, X3>(
 *   f: ((x1: X1, x2: X2, x3: X3) => boolean) | boolean | undefined,
 *   x1: X1,
 *   x2: X2,
 *   x3: X3,
 * ) => boolean}
 */
export const cut3 = (f, x1, x2, x3) =>
  typeof f === "function" ? f(x1, x2, x3) : !!f;

/**
 * @type {<X1, X2, X3, X4>(
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
 * @type {<X1, X2, X3, X4, X5>(
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

/** @type {<X, Y>(entry: [X, Y]) => [X, null]} */
const cleanupEntry = ([key, _val]) => [key, null];

/**
 * @type {<L>(
 *   pointcut: import("../../type/advice").ObjectPointcut<L>,
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     L
 *   >,
 * ) => boolean}
 */
const cutObject = (pointcut, point) => {
  switch (point.type) {
    case "program.enter": {
      return cut4(
        pointcut["program.enter"],
        point.sort,
        point.head,
        reduceEntry(
          map(
            /** @type {[Parameter | unbuild.Variable][]} */ listEntry(
              point.frame,
            ),
            cleanupEntry,
          ),
        ),
        point.location,
      );
    }
    case "program.completion": {
      return cut3(
        pointcut["program.completion"],
        point.sort,
        null,
        point.location,
      );
    }
    case "program.failure": {
      return cut3(
        pointcut["program.failure"],
        point.sort,
        null,
        point.location,
      );
    }
    case "program.leave": {
      return cut2(pointcut["program.leave"], point.sort, point.location);
    }
    case "closure.enter": {
      return cut4(
        pointcut["closure.enter"],
        point.kind,
        null,
        reduceEntry(
          map(
            /** @type {[Parameter | unbuild.Variable][]} */ listEntry(
              point.frame,
            ),
            cleanupEntry,
          ),
        ),
        point.location,
      );
    }
    case "closure.failure": {
      return cut3(
        pointcut["closure.failure"],
        point.kind,
        null,
        point.location,
      );
    }
    case "closure.completion": {
      return cut3(
        pointcut["closure.completion"],
        point.kind,
        null,
        point.location,
      );
    }
    case "closure.leave": {
      return cut2(pointcut["closure.leave"], point.kind, point.location);
    }
    case "block.enter": {
      return cut4(
        pointcut["block.enter"],
        point.kind,
        point.labels,
        reduceEntry(
          map(
            /** @type {[Parameter | unbuild.Variable][]} */ listEntry(
              point.frame,
            ),
            cleanupEntry,
          ),
        ),
        point.location,
      );
    }
    case "block.failure": {
      return cut3(pointcut["block.failure"], point.kind, null, point.location);
    }
    case "block.completion": {
      return cut2(pointcut["block.completion"], point.kind, point.location);
    }
    case "block.leave": {
      return cut2(pointcut["block.leave"], point.kind, point.location);
    }
    case "debugger.before": {
      return cut1(pointcut["debugger.before"], point.location);
    }
    case "debugger.after": {
      return cut1(pointcut["debugger.after"], point.location);
    }
    case "break.before": {
      return cut2(pointcut["break.before"], point.label, point.location);
    }
    case "return.before": {
      return cut2(pointcut["return.before"], null, point.location);
    }
    case "intrinsic.after": {
      return cut3(
        pointcut["intrinsic.after"],
        point.name,
        null,
        point.location,
      );
    }
    case "primitive.after": {
      return cut2(pointcut["primitive.after"], point.value, point.location);
    }
    case "closure.after": {
      return cut5(
        pointcut["closure.after"],
        point.kind,
        point.asynchronous,
        point.generator,
        null,
        point.location,
      );
    }
    case "read.after": {
      return cut3(pointcut["read.after"], point.variable, null, point.location);
    }
    case "write.before": {
      return cut3(
        pointcut["write.before"],
        point.variable,
        null,
        point.location,
      );
    }
    case "branch.before": {
      return cut3(pointcut["branch.before"], point.kind, null, point.location);
    }
    case "branch.after": {
      return cut2(pointcut["branch.after"], point.kind, point.location);
    }
    case "import.after": {
      return cut4(
        pointcut["import.after"],
        point.source,
        point.specifier,
        null,
        point.location,
      );
    }
    case "drop.before": {
      return cut2(pointcut["drop.before"], null, point.location);
    }
    case "export.before": {
      return cut3(
        pointcut["export.before"],
        point.specifier,
        null,
        point.location,
      );
    }
    case "conditional.before": {
      return cut2(pointcut["conditional.before"], null, point.location);
    }
    case "conditional.after": {
      return cut2(pointcut["conditional.after"], null, point.location);
    }
    case "eval.before": {
      return cut3(pointcut["eval.before"], null, point.context, point.location);
    }
    case "eval.after": {
      return cut2(pointcut["eval.after"], null, point.location);
    }
    case "await.before": {
      return cut2(pointcut["await.before"], null, point.location);
    }
    case "await.after": {
      return cut2(pointcut["await.after"], null, point.location);
    }
    case "yield.before": {
      return cut3(
        pointcut["yield.before"],
        point.delegate,
        null,
        point.location,
      );
    }
    case "yield.after": {
      return cut3(
        pointcut["yield.after"],
        point.delegate,
        null,
        point.location,
      );
    }
    case "apply": {
      return cut4(
        pointcut.apply,
        null,
        null,
        map(point.arguments, returnNull),
        point.location,
      );
    }
    case "construct": {
      return cut3(
        pointcut.construct,
        null,
        map(point.arguments, returnNull),
        point.location,
      );
    }
    default: {
      throw new AranTypeError(point);
    }
  }
};

/**
 * @type {<L>(
 *   point: import("../../type/advice").Point<
 *     aran.Expression<weave.ResAtom>,
 *     L
 *   >,
 *   pointcut: import("../../type/advice").Pointcut<L>,
 * ) => boolean}
 */
export const cut = (point, pointcut) => {
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
