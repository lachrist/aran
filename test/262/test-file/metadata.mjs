import { parse as parseYaml } from "yaml";
import { AranExecError } from "../error.mjs";

const BEGIN = "/*---";

const END = "---*/";

/**
 * @type {(
 *   content: string,
 * ) => import("../metadata.d.ts").Metadata}
 */
export const parseMetadata = (content) => {
  const begin = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (begin === -1 || end === -1) {
    throw new AranExecError("missing metadata header");
  }
  return {
    negative: null,
    includes: [],
    flags: [],
    locale: [],
    features: [],
    ...parseYaml(content.slice(begin + BEGIN.length, end)),
  };
};
