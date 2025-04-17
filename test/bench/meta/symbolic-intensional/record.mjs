import { openSync, writeSync } from "node:fs";

const { Error, String } = globalThis;

/**
 * @type {import("./record.d.ts").Serial}
 */
const undefined_serial = { undefined: null };

/**
 * @type {import("./record.d.ts").Serial}
 */
const reference_serial = { reference: null };

/**
 * @type {(
 *   value: import("linvail").Value,
 * ) => import("./record.d.ts").Serial}
 */
export const serialize = (value) => {
  switch (typeof value) {
    case "undefined": {
      return undefined_serial;
    }
    case "function": {
      return reference_serial;
    }
    case "object": {
      return value && reference_serial;
    }
    case "bigint": {
      return { bigint: String(value) };
    }
    case "symbol": {
      return { symbol: value.description ?? null };
    }
    case "boolean": {
      return value;
    }
    case "number": {
      return value;
    }
    case "string": {
      return value;
    }
    default: {
      throw new Error("unknown type");
    }
  }
};

const { process, JSON, Array } = globalThis;
/**
 * @type {(
 *   options: {
 *     output: URL,
 *     buffer_length: number,
 *   },
 * ) => import("./record.d.ts").Record}
 */
export const compileFileRecord = ({ output, buffer_length }) => {
  /** @type {string[]} */
  const lines = new Array(buffer_length);
  let index = 0;
  const handle = openSync(output, "w");
  process.on("exit", () => {
    writeSync(handle, lines.slice(0, index).join("\n") + "\n", null, "utf8");
  });
  return /** @type {(...args: any) => void} */ (
    (...data) => {
      if (index === buffer_length) {
        writeSync(1, "flush\n", null, "utf8");
        writeSync(handle, lines.join("\n") + "\n", null, "utf8");
        index = 0;
      }
      lines[index++] = JSON.stringify(data);
    }
  );
};
