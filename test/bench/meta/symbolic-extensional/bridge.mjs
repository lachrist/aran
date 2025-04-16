export const intrinsic_global_variable = "_INTRINSIC_RECORD_";
export const provenance_advice_global_variable = "_PROVENANCE_ADVICE_";
export const analysis_advice_global_variable = "_ANALYSIS_ADVICE_";

const {
  Reflect: { ownKeys },
} = globalThis;

/**
 * @type {{
 *   [key in import("./pointcut.d.ts").Pointcut]: null
 * }}
 */
const analysis_pointcut_record = {
  "primitive@after": null,
  "intrinsic@after": null,
  "yield@after": null,
  "import@after": null,
  "await@after": null,
  "closure@after": null,
  "block@declaration": null,
  "apply@around": null,
  "construct@around": null,
  "program-block@after": null,
};

/**
 * @type {import("./pointcut.d.ts").Pointcut[]}
 */
export const analysis_pointcut = /** @type {any[]} */ (
  ownKeys(analysis_pointcut_record)
);
