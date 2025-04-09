import { AranExecError, AranTypeError } from "../error.mjs";
import { hasNarrowKey } from "../util/index.mjs";

/**
 * @type {{[key in import("./sort.d.ts").RootSort]: null}}
 */
const ROOT_SORT_RECORD = {
  "script": null,
  "module": null,
  "eval.global": null,
  "eval.local.root": null,
};

/**
 * @type {(
 *   sort: import("./sort.d.ts").Sort,
 * ) => sort is import("./sort.d.ts").RootSort}
 */
export const isRootSort = (sort) => hasNarrowKey(ROOT_SORT_RECORD, sort);

/**
 * @type {{[key in import("./sort.d.ts").NodeSort]: null}}
 */
const NODE_SORT_RECORD = {
  "eval.local.deep": null,
};

/**
 * @type {(
 *   sort: import("./sort.d.ts").Sort,
 * ) => sort is import("./sort.d.ts").NodeSort}
 */
export const isNodeSort = (sort) => hasNarrowKey(NODE_SORT_RECORD, sort);

/**
 * @type {(
 *   program: import("./source.d.ts").Source,
 * ) => import("./sort.d.ts").Sort}
 */
export const getProgramSort = (program) => {
  switch (program.kind) {
    case "module": {
      return "module";
    }
    case "script": {
      return "script";
    }
    case "eval": {
      switch (program.situ.type) {
        case "global": {
          return "eval.global";
        }
        case "local": {
          return "eval.local.root";
        }
        case "aran": {
          return "eval.local.deep";
        }
        default: {
          throw new AranTypeError(program.situ);
        }
      }
    }
    default: {
      throw new AranTypeError(program);
    }
  }
};

/**
 * @type {(
 *   program: import("./source.d.ts").Source,
 * ) => import("./sort.d.ts").RootSort}
 */
export const getRootSort = (program) => {
  const sort = getProgramSort(program);
  if (isRootSort(sort)) {
    return sort;
  } else {
    throw new AranExecError("expected a root sort", { program, sort });
  }
};

/**
 * @type {(
 *   sort: import("./sort.d.ts").Sort,
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
 *  sort: import("./sort.d.ts").Sort,
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
