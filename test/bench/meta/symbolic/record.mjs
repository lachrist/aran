import { closeSync, openSync, writeSync } from "node:fs";

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
 *   value: unknown,
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

const max_byte = 256 * 1024 ** 3; // 256GB

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
  let line_count = 0;
  let byte_count = 0;
  let index = 0;
  const handle = openSync(output, "w");
  process.on("exit", () => {
    writeSync(handle, lines.slice(0, index).join(""), null, "utf8");
    closeSync(handle);
    writeSync(
      1,
      JSON.stringify({ line_count, byte_count }) + "\n",
      null,
      "utf8",
    );
  });
  return /** @type {(...args: any) => void} */ (
    (...data) => {
      if (index === buffer_length) {
        if (byte_count > max_byte) {
          writeSync(
            1,
            `#lines = ${line_count}, #bytes = ${byte_count}`,
            null,
            "utf8",
          );
          throw new Error("TRACE OVERFLOW");
        }
        writeSync(handle, lines.join("\n") + "\n", null, "utf8");
        index = 0;
      }
      const line = JSON.stringify(data);
      line_count++;
      byte_count += line.length + 1;
      lines[index++] = line;
    }
  );
};
