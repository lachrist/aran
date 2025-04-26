const { URL } = globalThis;

export const trace_home = new URL("trace", import.meta.url);

/**
 * @type {(
 *   conf: {
 *     base: import("../../enum.d.ts").Base,
 *     meta: import("../../enum.d.ts").Meta,
 *   },
 * ) => string}
 */
export const printTraceName = ({ base, meta }) =>
  `trace/${base}-${meta.replaceAll("/", "-")}.txt`;

/**
 * @type {(
 *   name: string
 * ) => {
 *   base: import("../../enum.d.ts").Base,
 *   meta: import("../../enum.d.ts").Meta,
 * }}
 */
export const parseTraceName = (name) => {
  const [base, ...rest] = name.split("-");
  return {
    // eslint-disable-next-line object-shorthand
    base: /** @type {import("../../enum.d.ts").Base} */ (base),
    meta: /** @type {import("../../enum.d.ts").Meta} */ (rest.join("/")),
  };
};
