import * as astring from "astring";
import * as acorn from "acorn";
import * as aran from "../lib/index.mjs";

const { String, eval: evalGlobal, addEventListener, postMessage } = globalThis;

const log = (data) => {
  postMessage(String(data));
};

addEventListener("message", ({ data: { analysis, target } }) => {
  try {
    evalGlobal(`((context) => {\n${analysis}\n});`)({
      astring,
      acorn,
      aran,
      log,
      target,
    });
  } catch (error) {
    log(error);
  }
});
