import * as astring from "astring";
import * as acorn from "acorn";
import * as aran from "../lib/index.mjs";
import { hasOwn } from "../lib/util/object.mjs";

const { String, eval: evalGlobal, addEventListener, postMessage } = globalThis;

const log = (data) => {
  postMessage(String(data));
};

const show = (value) => {
  if (typeof value === "function") {
    const name = hasOwn(value, "name") ? value.name : null;
    return typeof name === "string" ? `<function ${value.name}>` : `<function>`;
  } else if (typeof value === "object") {
    return value === null ? "null" : "<object>";
  } else if (typeof value === "string") {
    return JSON.stringify(value);
  } else if (typeof value === "symbol") {
    const name = value.description;
    return typeof name === "string" ? `<symbol ${name}>` : "<symbol>";
  } else {
    return String(value);
  }
};

addEventListener("message", ({ data: { analysis, target } }) => {
  try {
    evalGlobal(`((context) => {\n${analysis}\n});`)({
      astring,
      acorn,
      aran,
      show,
      log,
      target,
    });
  } catch (error) {
    log(error);
  }
});
