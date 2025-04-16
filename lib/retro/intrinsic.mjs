import { AranTypeError } from "../error.mjs";
import { reduceChild } from "../lang/index.mjs";
import { generateIntrinsicRecord } from "../setup/index.mjs";
import { createSafeSet, flatenTree, listKey, map } from "../util/index.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleIntrinsic } from "./mangle.mjs";

const {
  Array: { from: toArray },
} = globalThis;

/**
 * @type {{[k in import("./intrinsic.d.ts").AmbientIntrinsic]: null}}
 */
const ambient_intrinsic_record = {
  "Array.from": null,
  "Reflect.apply": null,
  "Symbol": null,
  "SyntaxError": null,
  "aran.deadzone_symbol": null,
  "aran.discardGlobalVariable": null,
  "aran.readGlobalVariable": null,
  "aran.retropileEvalCode": null,
  "aran.typeofGlobalVariable": null,
  "aran.writeGlobalVariableSloppy": null,
  "aran.writeGlobalVariableStrict": null,
};

const ambient_intrinsic_enum = listKey(ambient_intrinsic_record);

/**
 * @type {(
 *   intrinsic: import("../lang/syntax.d.ts").Intrinsic,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeArbitraryIntrinsicExpression = (intrinsic, config) => {
  if (intrinsic === "undefined") {
    return {
      type: "UnaryExpression",
      operator: "void",
      prefix: true,
      argument: {
        type: "Literal",
        raw: null,
        bigint: null,
        regex: null,
        value: 0,
      },
    };
  } else {
    return mangleIntrinsic(intrinsic, config);
  }
};

/**
 * @type {(
 *   intrinsic: import("./intrinsic.d.ts").AmbientIntrinsic,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeAmbientIntrinsicExpression = mangleIntrinsic;

/**
 * @type {(
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeIntrinsicValue = (config) => {
  switch (config.mode) {
    case "normal": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "Identifier",
          name: config.global_object_variable,
        },
        property: {
          type: "Literal",
          raw: null,
          bigint: null,
          regex: null,
          value: config.intrinsic_global_variable,
        },
      };
    }
    case "standalone": {
      return generateIntrinsicRecord(config);
    }
    default: {
      throw new AranTypeError(config.mode);
    }
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   collection: import("../util/collection.js").SafeSet<
 *     import("../lang/syntax.d.ts").Intrinsic
 *   >,
 *   node: import("./atom.d.ts").Node,
 * ) => import("../util/collection.js").SafeSet<
 *   import("../lang/syntax.d.ts").Intrinsic
 * >}
 */
const collectIntrinsicLoop = (collection, node) => {
  if (node.type === "IntrinsicExpression") {
    collection.$add(node.intrinsic);
  }
  if (node.type === "RoutineBlock" || node.type === "SegmentBlock") {
    const { length } = node.bindings;
    for (let index = 0; index < length; index += 1) {
      collection.$add(node.bindings[index][1]);
    }
  }
  return reduceChild(node, collectIntrinsicLoop, collection);
};
/* eslint-eanble local/no-impure */

/**
 * @type {(
 *   root: import("./atom.d.ts").Program,
 * ) => import("../lang/syntax.d.ts").Intrinsic[]}
 */
const collectIntrinsic = (root) =>
  toArray(
    collectIntrinsicLoop(createSafeSet(ambient_intrinsic_enum), root).$keys(),
  );

/**
 * @type {(
 *   root: import("./atom.d.ts").Program,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
export const listIntrinsicDeclaration = (root, config) => ({
  type: "VariableDeclaration",
  kind: "const",
  declarations: flatenTree([
    {
      type: "VariableDeclarator",
      id: mangleIntrinsic(null, config),
      init: makeIntrinsicValue(config),
    },
    map(collectIntrinsic(root), (intrinsic) => ({
      type: "VariableDeclarator",
      id: mangleIntrinsic(intrinsic, config),
      init: {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: mangleIntrinsic(null, config),
        property: makeSimpleLiteral(intrinsic),
      },
    })),
  ]),
});
