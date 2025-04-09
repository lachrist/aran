import { writeFile } from "node:fs/promises";
import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile, setupile } from "aran";

const {
  URL,
  Object: { hasOwn },
} = globalThis;

await writeFile(
  new URL("./setup.mjs", import.meta.url),
  ["// @ts-nocheck", "/* eslint-disable */", generate(setupile({}))].join("\n"),
  "utf8",
);

/** @type {(node: any) => string} */
const locate = (node) => {
  if (!hasOwn(node, "loc")) {
    return "???";
  }
  const { start } = node.loc;
  return `${node.type}:${start.line}:${start.column}`;
};

/** @type {import("aran").Digest} */
const _digest = (node, node_path, _file_path, _node_kind) =>
  `${node_path}#${locate(node)}`;

/** @type {import("../../transform").Transform} */
export default {
  transformBase: (code) =>
    generate(
      retropile(
        transpile({
          path: "main.mjs",
          kind: "module",
          root: parse(code, {
            locations: true,
            sourceType: "module",
            ecmaVersion: 2024,
          }),
        }),
      ),
    ),
  transformMeta: (code) => code,
};
