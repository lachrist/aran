import { setup } from "../main-basic.mjs";

setup({
  target: /** @type {any} */ (globalThis).__TARGET__,
  tracking: "intra",
});
