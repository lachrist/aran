import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile } from "aran";
import { intrinsic_global_variable } from "./bridge.mjs";
import { weave } from "../../../aspects/track-origin.mjs";

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
const digest = (node, node_path, _file_path, _node_kind) =>
  `${node_path}#${locate(node)}`;

/** @type {import("../../transform.d.ts").Transform} */
export default {
  transformBase: ({ path, kind, code }) =>
    generate(
      retropile(
        weave(
          transpile(
            {
              path,
              kind,
              root: parse(code, {
                locations: true,
                sourceType: kind,
                ecmaVersion: 2024,
              }),
            },
            { digest },
          ),
        ),
        { intrinsic_global_variable },
      ),
    ),
  transformMeta: ({ code }) => code,
};
