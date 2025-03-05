import * as astring from "astring";
import * as acorn from "acorn";
import * as aran from "aran";
import * as linvail from "linvail";

const {
  String,
  eval: evalGlobal,
  addEventListener,
  postMessage,
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   data: unknown,
 * ) => void}
 */
const log = (data) => {
  postMessage(String(data));
};

addEventListener("error", (event) => {
  log(event.message);
  event.preventDefault();
});

addEventListener("unhandledrejection", (event) => {
  log("Promise rejection: " + String(event.reason));
  event.preventDefault();
});

/** @type {import("./context").Context} */
const context = {
  astring,
  acorn: /** @type {any} */ (acorn),
  aran,
  linvail,
  log,
  target: "",
};

const descriptor = {
  __proto__: null,
  value: context,
  writable: false,
  enumerable: false,
  configurable: false,
};

defineProperty(globalThis, "context", descriptor);

addEventListener("message", ({ data: { meta, base } }) => {
  context.target = base;
  evalGlobal(meta);
});
