
import {includes} from "array-lite";
import {InvalidOptionsAranError} from "../util.mjs";

const {
  Array: {isArray},
  Reflect:{apply},
  Map:{prototype:{get:getMap, has:hasMap}},
  Set:{prototype:{get:getSet, has:hasSet}},
} = globalThis;

export const applyPoint = (point, name, values) => {
  if (typeof point === "boolean") {
    return point;
  }
  if (typeof point === "function") {
    return apply(point, undefined, values);
  }
  throw new InvalidOptionsAranError(`Pointcut value for ${name} is invalid. It should either be: missing, a boolean, or a function.`);
};

export const cut = (pointcut, name, values) => {
  if (typeof pointcut === "boolean") {
    return pointcut;
  }
  if (isArray(pointcut)) {
    return includes(pointcut, name);
  }
  if (pointcut instanceof Set) {
    return apply(pointcut, hasSet, [name]);
  }
  if (pointcut instanceof Map) {
    return apply(pointcut, hasMap, [name]) ?
    applyPoint(
      apply(pointcut, getMap, [name]),
      name,
      values,
    ) : false;
  }
  if (typeof pointcut === "object") {
    return (name in pointcut) ? applyPoint(pointcut[name], name, values) : false;
  }
  if (typeof pointcut === "function") {
    return apply(pointcut, undefined, concat([name], values));
  }
  throw new InvalidOptionsAranError("invalid pointcut format. It should either be: a boolean, an array, a set, a map, an object, or a function.");
};
