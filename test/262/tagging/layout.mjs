const { URL } = globalThis;

/**
 * @type {(
 *   tag: import("./tag").Tag,
 * ) => URL}
 */
export const locateTag = (tag) => new URL(`data/${tag}.txt`, import.meta.url);
