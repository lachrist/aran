import { open } from "node:fs/promises";
import { dir as dirNode } from "node:console";
import { compileAran } from "../../aran.mjs";
import { record } from "../../../record/index.mjs";
import { compileListPrecursorFailure } from "../../failure.mjs";
import { compileListThresholdExclusion } from "./threshold.mjs";
import { printBranching } from "./branching.mjs";
import { digest, parseNodeHash, toEvalPath } from "./location.mjs";
import { createAdvice, weave } from "./track-store-aspect.mjs";
import { advice_global_variable } from "./globals.mjs";

const {
  URL,
  Reflect: { defineProperty },
} = globalThis;

/**
 * @typedef {import("./location.d.ts").NodeHash} NodeHash
 * @typedef {import("./location.d.ts").FilePath} FilePath
 * @typedef {import("./location.d.ts").Atom} Atom
 */

/**
 * @type {(
 *   config: {
 *     include: "main" | "comp",
 *     global: "internal" | "external",
 *   },
 * ) => Promise<import("../../stage.d.ts").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     index: import("../../../test-case.d.ts").TestIndex,
 *     buffer: import("./branch.d.ts").Branch[],
 *   },
 * >>}
 */
export const createStage = async ({ include, global }) => {
  const listPrecursorFailure = await compileListPrecursorFailure([
    `linvail/stnd-${include}`,
  ]);
  const { prepare, trans, retro } = compileAran(
    {
      digest,
      global_declarative_record: include === "comp" ? "emulate" : "builtin",
      mode: "normal",
      escape_prefix: "$aran",
      global_object_variable: "globalThis",
      intrinsic_global_variable: "__aran_intrinsic__",
    },
    toEvalPath,
  );

  const listThresholdExclusion = await compileListThresholdExclusion(include);
  return {
    open: async ({ record_directory }) => ({
      record_directory,
      handle: await open(
        new URL(
          `track/store-${include === "comp" ? `comp-${global}` : include}-output.jsonl`,
          import.meta.url,
        ),
        "w",
      ),
    }),
    close: async ({ handle }) => {
      await handle.close();
    },
    setup: async ({ handle, record_directory }, [index, _test]) => {
      const reasons = [
        ...listPrecursorFailure(index),
        ...listThresholdExclusion(index),
      ];
      if (reasons.length > 0) {
        await handle.write("\n");
        return { type: "exclude", reasons };
      } else {
        return {
          type: "include",
          state: {
            handle,
            index,
            record_directory,
            buffer: [],
          },
          flaky: false,
          negatives: [],
        };
      }
    },
    prepare: ({ buffer, record_directory }, context) => {
      const { intrinsics } = prepare(context, { record_directory });
      const actual_global = intrinsics.globalThis;
      const advice = createAdvice({
        instrument_dynamic_code: include === "comp",
        internalize_global_scope: global === "internal",
        dir: (value) => {
          dirNode(value, { showProxy: true, showHidden: true });
        },
        evalScript: /** @type {any} */ (intrinsics.globalThis).$262.evalScript,
        intrinsics,
        retro,
        trans,
        recordBranch: (_kind, prov, hash) => {
          const { path, type } = parseNodeHash(hash);
          buffer.push({ path, type, prov });
        },
        toEvalPath,
        record_directory,
      });
      const descriptor = {
        __proto__: null,
        value: advice,
        enumerable: false,
        writable: false,
        configurable: false,
      };
      defineProperty(actual_global, advice_global_variable, descriptor);
    },
    instrument: (
      { record_directory },
      { type, kind, path, content: code1 },
    ) => {
      if (include === "comp" || type === "main") {
        const root1 = trans(/** @type {FilePath} */ (path), kind, code1);
        const root2 = weave(root1);
        const code2 = retro(root2);
        return record({ path, content: code2 }, record_directory);
      } else {
        return record({ path, content: code1 }, record_directory);
      }
    },
    teardown: async ({ handle, buffer }) => {
      await handle.write(printBranching(buffer) + "\n");
    },
  };
};
