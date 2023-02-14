import {
  bind_,
  convertListArray,
  convertArrayList,
} from "../../util/index.mjs";

export { unmangleVariable } from "./variable.mjs";

export * from "./extend.mjs";

export * from "./layer.mjs";

const {
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

export const ROOT_SCOPE = null;

const deepClone = bind_(parseJSON, stringifyJSON);

export const packScope = bind_(deepClone, convertListArray);

export const unpackScope = bind_(deepClone, convertArrayList);
