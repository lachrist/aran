import { parse as parseYaml } from "yaml";

const BEGIN = "/*---";

const END = "---*/";

/**
 * @type {(
 *   content: string,
 * ) => import("./types").Outcome<
 *   import("./types").Metadata,
 *   import("./types").TestError
 * >}
 */
export const parseMetadata = (content) => {
  const begin = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (begin === -1 || end === -1) {
    return {
      type: "failure",
      error: {
        type: "metadata",
        message: "missing metadata header",
      },
    };
  } else {
    const header = content.slice(begin + BEGIN.length, end);
    let metadata = {};
    try {
      metadata = parseYaml(header);
    } catch (error) {
      return {
        type: "failure",
        error: {
          type: "metadata",
          message: /** @type {Error} */ (error).message,
        },
      };
    }
    return {
      type: "success",
      value: {
        negative: null,
        includes: [],
        flags: [],
        locale: ["en"],
        features: [],
        ...metadata,
      },
    };
  }
};
