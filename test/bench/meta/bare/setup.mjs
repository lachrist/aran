import { compileIntrinsicRecord } from "aran/runtime";
import { intrinsic_global_variable } from "./bridge.mjs";

/** @type {any} */ (globalThis)[intrinsic_global_variable] =
  compileIntrinsicRecord(globalThis);
