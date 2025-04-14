import { open } from "node:fs/promises";
import { weaveStandard } from "aran";
import {
  createRuntime,
  standard_pointcut as pointcut,
  toStandardAdvice,
} from "linvail/runtime";
import { compileAran } from "../../aran.mjs";
import { record } from "../../../record/index.mjs";
import { compileListPrecursorFailure } from "../../failure.mjs";
import { compileListThresholdExclusion } from "./threshold.mjs";
import { compileInterceptEval } from "../../helper.mjs";
import { printBranching } from "./branching.mjs";
import { digest, parseNodeHash, toEvalPath } from "./location.mjs";
import { isStandardPrimitive } from "./primitive.mjs";

const {
  URL,
  Object: { assign },
  Reflect: { defineProperty },
  console: { dir },
} = globalThis;

/**
 * @typedef {import("./location.js").NodeHash} NodeHash
 * @typedef {import("./location.js").FilePath} FilePath
 * @typedef {import("./location.js").Atom} Atom
 */

const advice_global_variable = "__ARAN_ADVICE__";

/**
 * @type {(
 *   standard_advice: import("linvail").StandardAdvice<NodeHash>,
 *   config: {
 *     advice: import("linvail").Advice,
 *     recordBranch: (
 *       kind: import("aran").TestKind,
 *       prov: number,
 *       hash: NodeHash,
 *     ) => void
 *   },
 * ) => import("linvail").StandardAdvice<NodeHash>}
 */
const updateAdvice = (
  standard_advice,
  { advice: { wrap, apply }, recordBranch },
) => ({
  ...standard_advice,
  "primitive@after": (_state, value, _tag) => ({
    type: "primitive",
    inner: value,
    prov: 1,
  }),
  "intrinsic@after": (_state, _name, value, _tag) => {
    if (isStandardPrimitive(value)) {
      return {
        type: "primitive",
        inner: value,
        prov: 1,
      };
    } else {
      return wrap(/** @type {import("linvail").Value} */ (value));
    }
  },
  "test@before": (_state, kind, value, tag) => {
    recordBranch(kind, /** @type {any} */ (value).prov, tag);
    return value.inner;
  },
  "apply@around": (_state, callee, that, input, _tag) => {
    const result = apply(callee, that, input);
    if (isStandardPrimitive(result.inner)) {
      let prov = 1;
      prov += /** @type {any} */ (result).prov;
      prov += /** @type {any} */ (callee).prov;
      prov += /** @type {any} */ (that).prov;
      const { length } = input;
      for (let index = 0; index < length; index++) {
        prov += /** @type {any} */ (input[index]).prov;
      }
      return {
        type: "primitive",
        inner: result.inner,
        prov,
      };
    } else {
      return result;
    }
  },
});

/**
 * @type {(
 *   config: {
 *     include: "main" | "comp",
 *     global: "internal" | "external",
 *   },
 * ) => Promise<import("../../stage.js").Stage<
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *   },
 *   {
 *     handle: import("node:fs/promises").FileHandle,
 *     record_directory: null | URL,
 *     index: import("../../../test-case.js").TestIndex,
 *     buffer: import("./branch.js").Branch[],
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
  /**
   * @type {(
   *   root: import("aran").Program<Atom>,
   * ) => import("aran").Program<Atom>}
   */
  const weave = (root) =>
    weaveStandard(root, {
      advice_global_variable,
      pointcut,
      initial_state: null,
    });
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
      const { advice } = createRuntime(intrinsics, {
        dir,
        wrapPrimitive: (primitive) => ({
          type: "primitive",
          inner: primitive,
          prov: 0,
        }),
        wrapGuestReference: (guest, apply, construct) => ({
          type: "guest",
          inner: guest,
          apply,
          construct,
          prov: 0,
        }),
        wrapHostReference: (host, kind) => ({
          type: "host",
          inner: null,
          kind,
          plain: host,
          prov: 0,
        }),
      });
      const actual_global = intrinsics.globalThis;
      advice.weaveEvalProgram = weave;
      if (include === "comp") {
        assign(
          advice,
          compileInterceptEval({
            toEvalPath,
            trans,
            retro,
            weave,
            String: intrinsics.globalThis.String,
            SyntaxError: intrinsics.globalThis.SyntaxError,
            enterValue: advice.wrap,
            leaveValue: ({ inner }) => inner,
            apply: advice.apply,
            construct: advice.construct,
            evalGlobal: /** @type {any} */ (intrinsics.globalThis.eval),
            evalScript: /** @type {any} */ (intrinsics.globalThis).$262
              .evalScript,
            Function: /** @type {any} */ (intrinsics.globalThis.Function),
            record_directory,
          }),
        );
      }
      if (global === "internal") {
        const { toHostReferenceWrapper } = advice;
        /** @type {import("linvail").GuestReference} */
        const plain_external_global = /** @type {any} */ (
          intrinsics.globalThis
        );
        const plain_internal_global = toHostReferenceWrapper(
          plain_external_global,
          { prototype: "Object.prototype" },
        );
        const external_global = plain_internal_global.inner;
        intrinsics.globalThis = /** @type {any} */ (external_global);
        intrinsics["aran.global_object"] = /** @type {any} */ (external_global);
        intrinsics["aran.global_declarative_record"] = /** @type {any} */ (
          toHostReferenceWrapper(
            /** @type {any} */ (intrinsics["aran.global_declarative_record"]),
            { prototype: "none" },
          ).inner
        );
      }
      const descriptor = {
        __proto__: null,
        value: updateAdvice(toStandardAdvice(advice), {
          advice,
          recordBranch: (_kind, prov, hash) => {
            const { path, type } = parseNodeHash(hash);
            buffer.push({ path, type, prov });
          },
        }),
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
