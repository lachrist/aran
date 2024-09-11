import { parse as parseYaml } from "yaml";
import { inspectErrorMessage } from "./error-serial.mjs";

const BEGIN = "/*---";

const END = "---*/";

/**
 * @type {(content: string) => import("./outcome").Outcome<
 *   import("./test262").Metadata,
 *   import("./error-serial").ErrorSerial,
 * >}
 */
export const parseMetadata = (content) => {
  const begin = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (begin === -1 || end === -1) {
    return {
      type: "failure",
      data: {
        name: "MetadataTest262Error",
        message: "Missing metadata header",
      },
    };
  } else {
    try {
      return {
        type: "success",
        data: {
          negative: null,
          includes: [],
          flags: [],
          locale: [],
          features: [],
          ...parseYaml(content.slice(begin + BEGIN.length, end)),
        },
      };
    } catch (error) {
      return {
        type: "failure",
        data: {
          name: "MetadataTest262Error",
          message: inspectErrorMessage(error),
        },
      };
    }
  }
};
