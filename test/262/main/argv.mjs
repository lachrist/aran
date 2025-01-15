import { isStageName } from "../staging/index.mjs";

/**
 * @type {(
 *   argv: string[],
 * ) => null | import("../staging/stage-name").StageName}
 */
export const getStageName = (argv) => {
  if (argv.length !== 1) {
    return null;
  }
  const arg0 = argv[0];
  if (!isStageName(arg0)) {
    return null;
  }
  return arg0;
};
