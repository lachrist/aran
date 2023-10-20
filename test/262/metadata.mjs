import { parse as parseYaml } from "yaml";

const { Error } = globalThis;

const BEGIN = "/*---";

const END = "---*/";

/**
 * @type {(content: string) => test262.Metadata}
 */
export const parseMetadata = (content) => {
  const begin = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (begin === -1 || end === -1) {
    throw new Error("Missing metadata header");
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
