import { compileAran } from "../aran.mjs";
import { record } from "../../record/index.mjs";
import {
  advice_global_variable,
  createAdvice,
  weave,
} from "../../../aspects/tree-size.mjs";
import { createWriteStream } from "node:fs";

const {
  URL,
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {import("aran").Digest}
 */
const digest = (_node, node_path, _file_path, _kind) => node_path;

/**
 * @type {(hash: string) => string}
 */
const toEvalPath = (hash) => `dynamic://eval/local/${hash}`;

/**
 * @type {import("aran").TransConfig}
 */
const trans_config = {
  global_declarative_record: "builtin",
  digest,
};

/**
 * @type {import("aran").RetroConfig}
 */
const retro_config = {
  mode: "normal",
  escape_prefix: "$aran",
  global_object_variable: "globalThis",
  intrinsic_global_variable: "__aran_intrinsic__",
};

const { setup, trans, retro } = compileAran(
  { ...trans_config, ...retro_config },
  toEvalPath,
);

////////////
// Export //
////////////

const stream = createWriteStream(new URL("tree-size.log", import.meta.url), {
  flags: "w",
  encoding: "utf8",
});

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["stnd-void"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    const descriptor = {
      __proto__: null,
      value: createAdvice(
        /** @type {{apply: any, construct: any}} */ (
          intrinsics["aran.global_object"].Reflect
        ),
        (kind, size, tag) => stream.write(`${kind} >> ${size} >> ${tag}\n`),
      ),
      enumerable: false,
      writable: false,
      configurable: false,
    };
    defineProperty(
      intrinsics["aran.global_object"],
      advice_global_variable,
      descriptor,
    );
  },
  instrument: ({ kind, path, content: code1 }) => {
    const root1 = trans(path, kind, code1);
    const root2 = weave(root1);
    const code2 = retro(root2);
    return record({ path, content: code2 });
  },
};
