import * as astring from "astring";
import * as acorn from "acorn";
import * as aran from "../lib/index.mjs";
import * as linvail from "linvail";

const { String, eval: evalGlobal, addEventListener, postMessage } = globalThis;

/**
 * @type {(
 *   data: unknown,
 * ) => void}
 */
const log = (data) => {
  postMessage(String(data));
};

addEventListener("message", ({ data: { meta: analysis, base: target } }) => {
  try {
    evalGlobal(`((context) => {\n${analysis}\n});`)({
      astring,
      acorn,
      aran,
      linvail,
      log,
      target,
    });
  } catch (error) {
    log(error);
  }
});
