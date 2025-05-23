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
  log(`Async error: ${event.message}`);
  event.preventDefault();
});

addEventListener("unhandledrejection", (event) => {
  log(`Promise rejection: ${String(event.reason)}`);
  event.preventDefault();
});

/** @type {import("./context.d.ts").Context} */
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

defineProperty(globalThis, "__context", descriptor);

addEventListener("message", ({ data: { meta, base } }) => {
  try {
    context.target = base;
    evalGlobal(meta);
  } catch (error) {
    console.dir(error);
    log(String(error));
  }
});
