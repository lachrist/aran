import { AranTypeError } from "../error.mjs";

/**
 * @type {(
 *   program: import("../source").Source,
 * ) => import("./sort").Sort}
 */
export const getProgramSort = (program) => {
  if (program.kind === "module" || program.kind === "script") {
    return program.kind;
  } else if (program.kind === "eval") {
    return `${program.kind}.${program.situ}`;
  } else {
    throw new AranTypeError(program);
  }
};

/**
 * @type {(
 *   sort: import("./sort").Sort,
 * ) => "script" | "module" | "eval"}
 */
export const getSortKind = (sort) => {
  if (sort === "module" || sort === "script") {
    return sort;
  } else if (
    sort === "eval.global" ||
    sort === "eval.local.deep" ||
    sort === "eval.local.root"
  ) {
    return "eval";
  } else {
    throw new AranTypeError(sort);
  }
};

/**
 * @type {(
 *  sort: import("./sort").Sort,
 * ) => "global" | "local.root" | "local.deep"}
 */
export const getSortSitu = (sort) => {
  if (sort === "module" || sort === "script" || sort === "eval.global") {
    return "global";
  } else if (sort === "eval.local.deep") {
    return "local.deep";
  } else if (sort === "eval.local.root") {
    return "local.root";
  } else {
    throw new AranTypeError(sort);
  }
};
