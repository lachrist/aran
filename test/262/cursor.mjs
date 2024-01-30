import { readFile, writeFile } from "node:fs/promises";

const { Object, JSON, TypeError } = globalThis;

/** @type {(url: URL) => Promise<string | null>} */
const readFileMaybe = async (url) => {
  try {
    return await readFile(url, "utf8");
  } catch {
    return null;
  }
};

/**
 * @type {(
 *   data: unknown
 * ) => data is import("./cursor").Cursor}
 */
const isProgress = (data) =>
  typeof data === "object" &&
  data !== null &&
  "stage" in data &&
  Object.hasOwn(data, "stage") &&
  typeof data.stage === "string" &&
  "target" in data &&
  Object.hasOwn(data, "target") &&
  (typeof data.target === "string" || data.target === null) &&
  "index" in data &&
  Object.hasOwn(data, "index") &&
  typeof data.index === "number";

/**
 * @type {(content: string) => import("./cursor").Cursor}
 */
export const parseCursor = (content) => {
  const data = JSON.parse(content);
  if (isProgress(data)) {
    return data;
  } else {
    throw new TypeError("Invalid progress file");
  }
};

/**
 * @type {(
 *   url: URL,
 * ) => Promise<import("./cursor").Cursor>}
 */
export const loadCursor = async (url) =>
  parseCursor(
    (await readFileMaybe(url)) ??
      '{"stage": "identity", "index": 0, "target": null}',
  );

/**
 * @type {(
 *   url: URL,
 *   cursor: import("./cursor").Cursor,
 * ) => Promise<void>}
 */
export const saveCursor = async (url, cursor) => {
  await writeFile(url, JSON.stringify(cursor));
};
