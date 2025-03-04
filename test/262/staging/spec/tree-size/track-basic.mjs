import { compileAran } from "../../aran.mjs";
import { record } from "../../../record/index.mjs";
import {
  advice_global_variable,
  createAdvice,
  compileWeave,
} from "./track-basic-aspect.mjs";
import { open } from "node:fs/promises";
import { compileListPrecursorFailure } from "../../failure.mjs";
import { compileListThresholdExclusion } from "./threshold.mjs";
import { printBranching } from "./branching.mjs";
import { digest, parseNodeHash, toEvalPath } from "./location.mjs";

const {
  URL,
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   config: {
 *     tracking: "stack" | "inter" | "intra",
 *     include: "main" | "comp",
 *   },
 * ) => Promise<import("../../stage").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     index: import("../../../test-case").TestIndex,
 *     buffer: import("./branch").Branch[],
 *   },
 * >>}
 */
export const compileStage = async ({ tracking, include }) => {
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
  const weave = compileWeave(tracking);
  const listThresholdExclusion = await compileListThresholdExclusion(include);
  return {
    open: async ({ record_directory }) => ({
      record_directory,
      handle: await open(
        new URL(`track/${tracking}-${include}-output.jsonl`, import.meta.url),
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
      /**
       * @type {(
       *   kind: import("aran").TestKind,
       *   size: import("./size").Size,
       *   hash: import("./location").NodeHash,
       * ) => void}
       */
      const recordBranch = (_kind, size, hash) => {
        const { path, type } = parseNodeHash(hash);
        buffer.push({ path, type, size });
      };
      const {
        "globalThis": {
          String,
          SyntaxError,
          Array: { of },
          Reflect: { apply, construct },
          Function,
          eval: evalGlobal,
          $262: { evalScript },
        },
        "aran.getValueProperty": getValueProperty,
      } = /**
       * @type {{
       *   globalThis: (
       *     & {[key in keyof typeof globalThis]: any}
       *     & { $262: { evalScript: any } }
       *   ),
       *   "aran.getValueProperty": any,
       * }}
       */ (/** @type {unknown} */ (intrinsics));
      const advice = createAdvice({
        instrument_dynamic_code: include === "comp",
        toEvalPath,
        trans,
        weave,
        retro,
        apply,
        construct,
        createArray: (values) => apply(of, null, values),
        getValueProperty,
        tracking,
        record_directory,
        recordBranch,
        Function,
        evalGlobal,
        evalScript,
        String,
        SyntaxError,
      });
      const descriptor = {
        __proto__: null,
        value: advice,
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
    instrument: (
      { record_directory },
      { type, kind, path, content: code1 },
    ) => {
      if (include === "comp" || type === "main") {
        const root1 = trans(
          /** @type {import("./location").FilePath} */ (path),
          kind,
          code1,
        );
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
