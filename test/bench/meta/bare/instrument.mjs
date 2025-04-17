import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import { intrinsic_global_variable } from "./bridge.mjs";

const {
  Object: { hasOwn },
} = globalThis;

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

/** @type {import("../../instrument.d.ts").Instrument} */
export default ({ kind, code }) =>
  generate(
    retropile(
      transpile({
        path: "$",
        kind,
        root: parse(code, {
          locations: false,
          sourceType: kind,
          ecmaVersion: 2024,
        }),
      }),
      { intrinsic_global_variable },
    ),
  );
