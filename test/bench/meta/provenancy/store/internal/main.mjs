import { setup } from "../../main-store.mjs";

setup({
  target: /** @type {any} */ (globalThis).__TARGET__,
  internalize_global_scope: true,
});
