import { parse } from "acorn";
import { generate } from "astring";
import { transpile, retropile, weaveStandard } from "aran";
import {
  advice_global_variable,
  intrinsic_global_variable,
} from "./globals.mjs";
import { digest } from "./location.mjs";
import { standard_pointcut as linvail_pointcut } from "linvail";

const {
  Object: { hasOwn },
  Reflect: { ownKeys },
} = globalThis;

/**
 * @type {<O extends object>(
 *   object: O
 * ) => (keyof O)[]}
 */
const listKey = /** @type {any} */ (ownKeys);

/**
 * @type {{ [k in import("./pointcut.d.ts").Pointcut]: null }}
 */
const pointcut_record = {
  "block@setup": null,
  "block@declaration-overwrite": null,
  "program-block@after": null,
  "closure-block@after": null,
  "closure@after": null,
  "import@after": null,
  "primitive@after": null,
  "test@before": null,
  "intrinsic@after": null,
  "await@before": null,
  "await@after": null,
  "yield@before": null,
  "read@after": null,
  "write@before": null,
  "yield@after": null,
  "export@before": null,
  "eval@before": null,
  "apply@around": null,
  "construct@around": null,
};

const remove = {
  stack: {
    "block@declaration-overwrite": null,
  },
  intra: {
    "read@after": null,
    "write@before": null,
  },
  inter: {
    "read@after": null,
    "write@before": null,
  },
};

/**
 * @type {(
 *   tracking: "stack" | "inter" | "intra",
 * ) => import("./pointcut.d.ts").Pointcut[]}
 */
export const createPointcut = (tracking) =>
  listKey(pointcut_record).filter((kind) => !hasOwn(remove[tracking], kind));

/**
 * @type {{
 *  [k in "stack" | "inter" | "intra" | "store"]:
 *    import("aran").StandardAspectKind[]
 * }}
 */
const pointcuts = {
  stack: createPointcut("stack"),
  intra: createPointcut("intra"),
  inter: createPointcut("inter"),
  store: linvail_pointcut,
};

/**
 * @type {(
 *   config: {
 *     tracking: "stack" | "inter" | "intra" | "store",
 *     global_declarative_record: "builtin" | "emulate",
 *   },
 * ) => import("../../instrument.d.ts").Instrument}
 */
export const compileInstrument =
  ({ tracking, global_declarative_record }) =>
  ({ kind, code }) =>
    generate(
      retropile(
        weaveStandard(
          transpile(
            {
              path: "$",
              kind,
              root: parse(code, {
                locations: true,
                sourceType: kind,
                ecmaVersion: 2024,
              }),
            },
            { digest, global_declarative_record },
          ),
          { advice_global_variable, pointcut: pointcuts[tracking] },
        ),
        { intrinsic_global_variable },
      ),
    );
