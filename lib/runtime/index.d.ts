import type { IntrinsicRecord } from "../lang/syntax";

/**
 * Compile the intrinsic record.
 * @param global The global object.
 * @returns The intrinsic record.
 */
export const compileIntrinsicRecord: (
  global: typeof globalThis,
) => IntrinsicRecord;
