import {includes, concat} from "array-lite";
import {InvalidOptionsAranError} from "../util.mjs";

const {
  undefined,
  Array: {isArray},
  Reflect: {apply},
  Map,
  Map: {
    prototype: {get: getMap, has: hasMap},
  },
  Set,
  Set: {
    prototype: {has: hasSet},
  },
} = globalThis;

export const applyPoint = (point, context, name, values) => {
  if (typeof point === "boolean") {
    return point;
  }
  if (typeof point === "function") {
    return apply(point, context, values);
  }
  throw new InvalidOptionsAranError(
    `Pointcut value for ${name} is invalid. It should either be: missing, a boolean, or a function.`,
  );
};

export const cut = (pointcut, name, values) => {
  if (typeof pointcut === "boolean") {
    return pointcut;
  }
  if (isArray(pointcut)) {
    return includes(pointcut, name);
  }
  if (pointcut instanceof Set) {
    return apply(hasSet, pointcut, [name]);
  }
  if (pointcut instanceof Map) {
    return apply(hasMap, pointcut, [name])
      ? applyPoint(apply(getMap, pointcut, [name]), pointcut, name, values)
      : false;
  }
  if (typeof pointcut === "object" && pointcut !== null) {
    return name in pointcut
      ? applyPoint(pointcut[name], pointcut, name, values)
      : false;
  }
  if (typeof pointcut === "function") {
    return apply(pointcut, undefined, concat([name], values));
  }
  throw new InvalidOptionsAranError(
    "invalid pointcut format. It should either be: a boolean, an array, a set, a map, an object, or a function.",
  );
};
