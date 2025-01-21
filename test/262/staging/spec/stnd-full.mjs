/* eslint-disable local/no-jsdoc-typedef */

import { weaveStandard } from "aran";
import { AranTestError } from "../../error.mjs";
import { compileAran } from "../aran.mjs";

const {
  Object: { hasOwn },
  Array: { isArray },
  Reflect: { getPrototypeOf, apply, defineProperty },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

/**
 * @typedef {`hash:${string}`} Hash
 * @typedef {`dynamic://eval/local${Hash}`} LocalEvalPath
 * @typedef {(
 *   | import("../../fetch").HarnessName
 *   | import("../../fetch").DependencyPath
 *   | import("../../fetch").TestPath
 *   | LocalEvalPath
 * )} FilePath
 * @typedef {string & {__brand: "Variable"}} Variable
 * @typedef {string & {__brand: "Label"}} Label
 * @typedef {string & {__brand: "Specifier"}} Specifier
 * @typedef {string & {__brand: "Source"}} Source

 * @typedef {{
 *   Variable: Variable,
 *   Label: Label,
 *   Specifier: Specifier,
 *   Source: Source,
 *   Tag: Hash,
 * }} Atom
 * @typedef {unknown & {__brand: "Value"}} Value
 * @typedef {{
 *   Scope: Value,
 *   Stack: Value,
 *   Other: Value,
 * }} Valuation
 * @typedef {"@state"} State
 */

/** @type {Variable} */
const ADVICE_VARIABLE = /** @type {any} */ ("aran.advice");

/** @type {State} */
const STATE = "@state";

/**
 * @type {import("aran").Digest<Hash, FilePath>}
 */
const digest = (_node, node_path, file_path, _kind) =>
  `hash:${file_path}:${node_path}`;

/**
 * @type {(hash: string) => FilePath}
 */
const toEvalPath = (hash) =>
  /** @type {FilePath} */ (`dynamic://eval/local/${hash}`);

const { setup, trans, retro } = compileAran(
  {
    mode: "normal",
    escape_prefix: "__aran__",
    global_variable: "globalThis",
    intrinsic_variable: "__intrinsic__",
    global_declarative_record: "builtin",
    digest,
  },
  toEvalPath,
);

/** @type {import("aran").StandardWeaveConfig<Atom>} */
const conf = {
  advice_variable: ADVICE_VARIABLE,
  initial_state: STATE,
  pointcut: true,
};

///////////////
// Predicate //
///////////////

/**
 * @type {(
 *   check: boolean
 * ) => asserts check}
 */
const assert = (value) => {
  if (!value) {
    throw new AranTestError("assertion failure");
  }
};

/**
 * @type {(
 *   label: Label,
 * ) => void}
 */
const assertLabel = (label) => {
  assert(typeof label === "string");
};

/**
 * @type {(
 *   variable: Variable | import("../../../../lib/lang/syntax").Parameter,
 * ) => void}
 */
const assertVariable = (variable) => {
  assert(typeof variable === "string");
};

/**
 * @type {(
 *   specifier: Specifier,
 * ) => void}
 */
const assertSpecifier = (specifier) => {
  assert(typeof specifier === "string");
};

/**
 * @type {(
 *   specifier: null | Specifier,
 * ) => void}
 */
const assertNullableSpecifier = (specifier) => {
  assert(specifier === null || typeof specifier === "string");
};

/**
 * @type {(
 *   source: Source,
 * ) => void}
 */
const assertSource = (source) => {
  assert(typeof source === "string");
};

const PREFIX = ["hash:"];

/**
 * @type {(
 *   hash: Hash
 * ) => void}
 */
const assertHash = (hash) => {
  assert(typeof hash === "string");
  assert(apply(startsWith, hash, PREFIX));
};

/**
 * @type {(
 *   arg: State,
 * ) => void}
 */
const assertState = (state) => {
  assert(state === STATE);
};

/**
 * @type {{[key in import("aran").AranProgramKind]: null}}
 */
const PROGRAM_KIND_ENUM = {
  "deep-local-eval": null,
  "global-eval": null,
  "module": null,
  "root-local-eval": null,
  "script": null,
};

/**
 * @type {(
 *   kind: import("aran").AranProgramKind,
 * ) => void}
 */
const assertProgramKind = (kind) => {
  assert(typeof kind === "string");
  assert(hasOwn(PROGRAM_KIND_ENUM, kind));
};

/**
 * @type {{[key in import("aran").AranSegmentKind]: null}}
 */
const SEGMENT_KIND_ENUM = {
  bare: null,
  catch: null,
  else: null,
  finally: null,
  then: null,
  try: null,
  while: null,
};

/**
 * @type {(
 *   kind: import("aran").AranSegmentKind,
 * ) => void}
 */
const assertSegmentKind = (kind) => {
  assert(typeof kind === "string");
  assert(hasOwn(SEGMENT_KIND_ENUM, kind));
};

/**
 * @type {{[key in import("aran").AranClosureKind]: null}}
 */
const CLOSURE_KIND_ENUM = {
  "arrow": null,
  "async-arrow": null,
  "async-function": null,
  "async-generator": null,
  "async-method": null,
  "function": null,
  "generator": null,
  "method": null,
};

/**
 * @type {(
 *   kind: import("aran").AranClosureKind,
 * ) => void}
 */
const assertClosureKind = (kind) => {
  assert(typeof kind === "string");
  assert(hasOwn(CLOSURE_KIND_ENUM, kind));
};

/**
 * @type {{[key in import("aran").AranGeneratorKind]: null}}
 */
const GENERATOR_KIND_ENUM = {
  "async-generator": null,
  "generator": null,
};

/**
 * @type {(
 *   kind: import("aran").AranGeneratorKind,
 * ) => void}
 */
const assertGeneratorKind = (kind) => {
  assert(typeof kind === "string");
  assert(hasOwn(GENERATOR_KIND_ENUM, kind));
};

/**
 * @type {{[key in import("aran").AranControlKind]: null}}
 */
const CONTROL_KIND_ENUM = {
  ...CLOSURE_KIND_ENUM,
  ...PROGRAM_KIND_ENUM,
  ...SEGMENT_KIND_ENUM,
};

/**
 * @type {(
 *   kind: import("aran").AranControlKind,
 * ) => void}
 */
const assertControlKind = (kind) => {
  assert(typeof kind === "string");
  assert(hasOwn(CONTROL_KIND_ENUM, kind));
};

/**
 * @type {{[key in import("aran").AranTestKind]: null}}
 */
const TEST_KIND_ENUM = {
  conditional: null,
  if: null,
  while: null,
};

/**
 * @type {(
 *   kind: import("aran").AranTestKind,
 * ) => void}
 */
const assertTestKind = (kind) => {
  assert(typeof kind === "string");
  assert(hasOwn(TEST_KIND_ENUM, kind));
};

/**
 * @type {{[key in import("aran").AranHeader["type"]]: null}}
 */
const HEADER_TYPE_ENUM = {
  aggregate: null,
  declare: null,
  export: null,
  import: null,
};

/**
 * @type {(
 *   head: import("aran").AranHeader[],
 * ) => void}
 */
const assertHeaderArray = (headers) => {
  assert(isArray(headers));
  const { length } = headers;
  for (let index = 0; index < length; index++) {
    const header = headers[index];
    assert(typeof header === "object" && header !== null);
    assert(hasOwn(header, "type"));
    assert(typeof header.type === "string");
    assert(hasOwn(HEADER_TYPE_ENUM, header.type));
  }
};

/**
 * @type {(
 *   head: Label[],
 * ) => void}
 */
const assertLabelArray = (labels) => {
  assert(isArray(labels));
  const { length } = labels;
  for (let index = 0; index < length; index++) {
    assert(typeof labels[index] === "string");
  }
};

/**
 * @type {(
 *   value: Value,
 * ) => void}
 */
const assertValue = (_value) => {};

/**
 * @type {(
 *   value: Value[],
 * ) => void}
 */
const assertValueArray = (values) => {
  assert(isArray(values));
};

/**
 * @type {(
 *   head: { [key in Variable]?: Value },
 * ) => void}
 */
const assertFrame = (frame) => {
  assert(typeof frame === "object" && frame !== null);
  assert(getPrototypeOf(frame) === null);
};

/**
 * @type {(
 *   boolean: boolean,
 * ) => void}
 */
const assertBoolean = (boolean) => {
  assert(typeof boolean === "boolean");
};

/**
 * @type {(
 *   closure: Function,
 * ) => void}
 */
const assertClosure = (closure) => {
  assert(typeof closure === "function");
};

/**
 * @type {(
 *   primitive: import("aran").AranPrimitive,
 * ) => void}
 */
const assertPrimitive = (primitive) => {
  assert(
    primitive == null ||
      typeof primitive === "boolean" ||
      typeof primitive === "string" ||
      typeof primitive === "symbol",
  );
};

/**
 * @type {(
 *   intrinsic: import("aran").AranIntrinsicName,
 * ) => void}
 */
const assertIntrinsicName = (intrinsic) => {
  assert(typeof intrinsic === "string");
};

/////////////////
// AssertInput //
/////////////////

/**
 * @type {(
 *   input: any[],
 *   asserts: ((arg: any) => void)[],
 * ) => void}
 */
const assertInput = (input, assertions) => {
  assert(input.length === assertions.length);
  const { length } = input;
  for (let index = 0; index < length; index++) {
    assertions[index](input[index]);
  }
};

/**
 * @type {<X1, X2, X3>(
 *   input: [X1, X2, X3],
 *   assertions: [
 *     (arg: X1) => void,
 *     (arg: X2) => void,
 *     (arg: X3) => void,
 *   ],
 * ) => void}
 */
const assertInput3 = assertInput;

/**
 * @type {<X1, X2, X3, X4>(
 *   input: [X1, X2, X3, X4],
 *   assertions: [
 *     (arg: X1) => void,
 *     (arg: X2) => void,
 *     (arg: X3) => void,
 *     (arg: X4) => void,
 *   ],
 * ) => void}
 */
const assertInput4 = assertInput;

/**
 * @type {<X1, X2, X3, X4, X5>(
 *   input: [X1, X2, X3, X4, X5],
 *   assertions: [
 *     (arg: X1) => void,
 *     (arg: X2) => void,
 *     (arg: X3) => void,
 *     (arg: X4) => void,
 *     (arg: X5) => void
 *   ],
 * ) => void}
 */
const assertInput5 = assertInput;

////////////
// Advice //
////////////

/**
 * @type {(
 *   reflect: {
 *     apply: (
 *       callee: Value,
 *       that: Value,
 *       args: Value[],
 *     ) => Value,
 *     construct: (
 *       callee: Value,
 *       args: Value[],
 *     ) => Value,
 *   },
 * ) => import("aran").CompleteStandardAdvice<
 *   State,
 *   Atom,
 *   Valuation,
 * >}
 */
const compileAdvice = ({ apply, construct }) => ({
  // Block //
  "block@setup": (...input) => {
    assertInput3(input, [assertState, assertControlKind, assertHash]);
    return input[0];
  },
  "program-block@before": (...input) => {
    assertInput4(input, [
      assertState,
      assertProgramKind,
      assertHeaderArray,
      assertHash,
    ]);
  },
  "closure-block@before": (...input) => {
    assertInput3(input, [assertState, assertClosureKind, assertHash]);
  },
  "segment-block@before": (...input) => {
    assertInput4(input, [
      assertState,
      assertSegmentKind,
      assertLabelArray,
      assertHash,
    ]);
  },
  "block@declaration": (...input) => {
    assertInput4(input, [
      assertState,
      assertControlKind,
      assertFrame,
      assertHash,
    ]);
  },
  "block@declaration-overwrite": (...input) => {
    assertInput4(input, [
      assertState,
      assertControlKind,
      assertFrame,
      assertHash,
    ]);
    return input[2];
  },
  "generator-block@suspension": (...input) => {
    assertInput3(input, [assertState, assertGeneratorKind, assertHash]);
  },
  "generator-block@resumption": (...input) => {
    assertInput3(input, [assertState, assertGeneratorKind, assertHash]);
  },
  "segment-block@after": (...input) => {
    assertInput3(input, [assertState, assertControlKind, assertHash]);
  },
  "program-block@after": (...input) => {
    assertInput4(input, [
      assertState,
      assertControlKind,
      assertValue,
      assertHash,
    ]);
    return input[2];
  },
  "closure-block@after": (...input) => {
    assertInput4(input, [
      assertState,
      assertControlKind,
      assertValue,
      assertHash,
    ]);
    return input[2];
  },
  "block@throwing": (...input) => {
    assertInput4(input, [
      assertState,
      assertControlKind,
      assertValue,
      assertHash,
    ]);
    return input[2];
  },
  "block@teardown": (...input) => {
    assertInput3(input, [assertState, assertControlKind, assertHash]);
  },
  // before || after //
  "write@before": (...input) => {
    assertInput4(input, [assertState, assertVariable, assertValue, assertHash]);
    return input[2];
  },
  "import@after": (...input) => {
    assertInput5(input, [
      assertState,
      assertSource,
      assertNullableSpecifier,
      assertValue,
      assertHash,
    ]);
    return input[3];
  },
  "primitive@after": (...input) => {
    assertInput3(input, [assertState, assertPrimitive, assertHash]);
    return /** @type {Value} */ (/** @type {unknown} */ (input[1]));
  },
  "read@after": (...input) => {
    assertInput4(input, [assertState, assertVariable, assertValue, assertHash]);
    return input[2];
  },
  "closure@after": (...input) => {
    assertInput4(input, [
      assertState,
      assertClosureKind,
      assertClosure,
      assertHash,
    ]);
    return /** @type {Value} */ (input[2]);
  },
  "test@before": (...input) => {
    assertInput4(input, [assertState, assertTestKind, assertValue, assertHash]);
    return !!input[2];
  },
  "intrinsic@after": (...input) => {
    assertInput4(input, [
      assertState,
      assertIntrinsicName,
      assertValue,
      assertHash,
    ]);
    return input[2];
  },
  "break@before": (...input) => {
    assertInput3(input, [assertState, assertLabel, assertHash]);
  },
  "drop@before": (...input) => {
    assertInput3(input, [assertState, assertValue, assertHash]);
    return input[1];
  },
  // before && after //
  "await@before": (...input) => {
    assertInput3(input, [assertState, assertValue, assertHash]);
    return input[1];
  },
  "await@after": (...input) => {
    assertInput3(input, [assertState, assertValue, assertHash]);
    return input[1];
  },
  "yield@before": (...input) => {
    assertInput4(input, [assertState, assertBoolean, assertValue, assertHash]);
    return input[2];
  },
  "yield@after": (...input) => {
    assertInput4(input, [assertState, assertBoolean, assertValue, assertHash]);
    return input[2];
  },
  "export@before": (...input) => {
    assertInput4(input, [
      assertState,
      assertSpecifier,
      assertValue,
      assertHash,
    ]);
    return input[2];
  },
  "eval@before": (...input) => {
    assertInput3(input, [assertState, assertValue, assertHash]);
    /** @type {import("aran").AranProgram<Atom>} */
    const root1 = /** @type {any} */ (input[1]);
    /** @type {import("aran").AranProgram} */
    const root2 = weaveStandard(root1, conf);
    assert(root2.kind === "eval");
    assert(root2.situ === "local.deep");
    return root2;
  },
  "eval@after": (...input) => {
    assertInput3(input, [assertState, assertValue, assertHash]);
    return input[1];
  },
  // around //
  "apply@around": (...input) => {
    assertInput5(input, [
      assertState,
      assertValue,
      assertValue,
      assertValueArray,
      assertHash,
    ]);
    return apply(input[1], input[2], input[3]);
  },
  "construct@around": (...input) => {
    assertInput4(input, [
      assertState,
      assertValue,
      assertValueArray,
      assertHash,
    ]);
    return construct(input[1], input[2]);
  },
});

////////////
// Export //
////////////

/**
 * @type {import("../stage").Stage}
 */
export default {
  precursor: ["bare-main"],
  negative: [],
  exclude: [],
  listLateNegative: (_test, _error) => [],
  setup: (context) => {
    const { intrinsics } = setup(context);
    defineProperty(intrinsics["aran.global"], ADVICE_VARIABLE, {
      // @ts-ignore
      __proto__: null,
      value: compileAdvice(
        /** @type {{apply: any, construct: any}} */ (
          intrinsics["aran.global"].Reflect
        ),
      ),
      enumerable: false,
      writable: false,
      configurable: false,
    });
  },
  instrument: ({ type, kind, path, content: code1 }) => {
    if (type === "main") {
      /** @type {import("aran").AranProgram<Atom>} */
      const root1 = trans(path, kind, code1);
      const root2 = weaveStandard(root1, conf);
      const code2 = retro(root2);
      return { path, content: code2 };
    } else {
      return { path, content: code1 };
    }
  },
};
