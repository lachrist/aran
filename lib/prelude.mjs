import { INTRINSIC_ENUM, isAranIntrinsic } from "./lang.mjs";
import { StaticError, map, reduce } from "./util/index.mjs";

const {
  Reflect: { apply, ownKeys: listKey },
  String: {
    prototype: { split },
  },
} = globalThis;

const AT = ["@"];

const DOT = ["."];

/**
 * @type {(
 *   name: string,
 * ) => estree.Identifier}
 */
const makeIdentifier = (name) => ({
  type: "Identifier",
  name,
});

/**
 * @type {(
 *   value: null | boolean | number | string,
 * ) => estree.Expression}
 */
const makeSimpleLiteral = (value) => ({
  type: "Literal",
  value,
});

/**
 * @type {(
 *   key: string,
 *  value: estree.Expression,
 * ) => estree.Property}
 */
const makeProperty = (key, value) => ({
  type: "Property",
  kind: "init",
  method: false,
  computed: false,
  shorthand: false,
  key: makeIdentifier(key),
  value,
});

/**
 * @type {(
 *   properties: estree.Property[],
 * ) => estree.Expression}
 */
const makeObjectExpression = (properties) => ({
  type: "ObjectExpression",
  properties,
});

/**
 * @type {(
 *   object: estree.Expression,
 *   name: string,
 * ) => estree.Expression}
 */
const makeMemberExpression = (object, name) => ({
  type: "MemberExpression",
  computed: false,
  optional: false,
  object,
  property: makeIdentifier(name),
});

/**
 * @type {(
 *   callee: estree.Expression,
 *   arguments_: estree.Expression[],
 * ) => estree.Expression}
 */
const makeCallExpression = (callee, arguments_) => ({
  type: "CallExpression",
  optional: false,
  callee,
  arguments: arguments_,
});

/**
 * @type {(
 *   callee: estree.Expression,
 *   arguments_: estree.Expression[],
 * ) => estree.Expression}
 */
const makeNewExpression = (callee, arguments_) => ({
  type: "NewExpression",
  callee,
  arguments: arguments_,
});

/**
 * @type {(
 *   object: estree.Expression,
 *   key: string,
 * ) => estree.Expression}
 */
const digGlobal = (object, key) => {
  const segments = apply(split, key, AT);
  return segments.length === 1
    ? makeMemberExpression(object, key)
    : makeMemberExpression(
        makeCallExpression(
          makeMemberExpression(
            makeMemberExpression(makeIdentifier("globalThis"), "Reflect"),
            "getOwnPropertyDescriptor",
          ),
          [object, makeSimpleLiteral(segments[0])],
        ),
        segments[1],
      );
};

/**
 * @type {(
 *   instrinsic: Exclude<aran.Intrinsic, aran.AranIntrinsic>,
 * ) => estree.Expression}
 */
const makeStandardIntrinsicExpression = (intrinsic) =>
  reduce(
    /** @type {string[]} */ (apply(split, intrinsic, DOT)),
    digGlobal,
    makeIdentifier("globalThis"),
  );

/**
 * @type {(intrinsic: aran.AranIntrinsic) => estree.Expression}
 */
const makeAranIntrinsicExpression = (intrinsic) => {
  switch (intrinsic) {
    case "aran.cache":
      return makeObjectExpression([
        makeProperty("__proto__", makeSimpleLiteral(null)),
      ]);
    case "aran.record.variables":
      return makeObjectExpression([
        makeProperty("__proto__", makeSimpleLiteral(null)),
      ]);
    case "aran.record.values":
      return makeObjectExpression([
        makeProperty("__proto__", makeSimpleLiteral(null)),
      ]);
    case "aran.deadzone":
      return makeCallExpression(
        makeMemberExpression(makeIdentifier("globalThis"), "Symbol"),
        [makeSimpleLiteral("deadzone")],
      );
    case "aran.private":
      return makeNewExpression(
        makeMemberExpression(makeIdentifier("globalThis"), "WeakMap"),
        [],
      );
    case "aran.hidden.weave":
      return makeObjectExpression([
        makeProperty("__proto__", makeSimpleLiteral(null)),
      ]);
    case "aran.hidden.rebuild":
      return makeObjectExpression([
        makeProperty("__proto__", makeSimpleLiteral(null)),
      ]);
    case "aran.unary":
      return TODO;
    case "aran.binary":
      return TODO;
    case "aran.throw":
      return TODO;
    case "aran.createObject":
      return TODO;
    case "aran.get":
      return TODO;
    case "aran.set":
      return TODO;
    case "aran.delete":
      return TODO;
    // TODO: investigate if still relevant
    case "aran.AranError":
      return TODO;
    case "aran.asynchronousGeneratorPrototype":
      return TODO;
    case "aran.generatorPrototype":
      return TODO;
    default:
      throw new StaticError("invalid aran intrinsic", intrinsic);
  }
};

/**
 * @type {(intrinsic: aran.Intrinsic) => estree.Expression}
 */
const makeIntrinsicExpression = (intrinsic) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic)
    : makeStandardIntrinsicExpression(intrinsic);

/**
 * @type {(intrinsic: aran.Intrinsic) => estree.Property}
 */
const makeIntrinsicProperty = (intrinsic) =>
  makeProperty(intrinsic, makeIntrinsicExpression(intrinsic));

/**
 * @type {estree.Expression}
 */
export const INTRINSIC = {
  type: "ObjectExpression",
  properties: [
    makeProperty("__proto__", makeSimpleLiteral(null)),
    ...map(
      /** @type {aran.Intrinsic[]} */ (listKey(INTRINSIC_ENUM)),
      makeIntrinsicProperty,
    ),
  ],
};
