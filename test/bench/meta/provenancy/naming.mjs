/**
 * @type {(
 *   conf: {
 *     base: import("../../enum.d.ts").Base,
 *     meta: import("../../enum.d.ts").Meta,
 *   },
 * ) => string}
 */
export const printExecName = ({ base, meta }) =>
  `${base}-${meta.replaceAll("/", "-")}`;

/**
 * @type {(
 *   name: string
 * ) => {
 *   base: import("../../enum.d.ts").Base,
 *   meta: import("../../enum.d.ts").Meta,
 * }}
 */
export const parseExecName = (name) => {
  const [base, ...rest] = name.split("-");
  return {
    // eslint-disable-next-line object-shorthand
    base: /** @type {import("../../enum.d.ts").Base} */ (base),
    meta: /** @type {import("../../enum.d.ts").Meta} */ (rest.join("/")),
  };
};
