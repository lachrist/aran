import { reduce } from "../util/index.mjs";
import { makeReadDependencyExpression } from "./dependency.mjs";
import { global_object_parameter } from "./global.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { includes },
    prototype: { split },
  },
} = globalThis;

const DOT = ["."];

const AT = ["@"];

/**
 * @type {(
 *   name: import("../lang/syntax.d.ts").Intrinsic,
 * ) => string[]}
 */
const splitIntrinsic = (intrinsic) => apply(split, intrinsic, DOT);

/**
 * @type {(
 *   segment: string,
 * ) => segment is `${string}@${string}`}
 */
const isAccessorSegment = (segment) => apply(includes, segment, AT);

/**
 * @type {(
 *   segment: `${string}@${string}`,
 * ) => string}
 */
const getAccessorName = (segment) => apply(split, segment, AT)[0];

/**
 * @type {(
 *   segment: `${string}@${string}`,
 * ) => string}
 */
const getAccessorKind = (segment) => apply(split, segment, AT)[1];

/**
 * @type {(
 *   object: import("estree-sentry").Expression<{}>,
 *   segment: string,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeMemberExpression = (object, segment) =>
  isAccessorSegment(segment)
    ? {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: {
          type: "CallExpression",
          optional: false,
          callee: makeReadDependencyExpression(
            "Reflect_getOwnPropertyDescriptor",
          ),
          arguments: [
            object,
            {
              type: "Literal",
              raw: null,
              bigint: null,
              regex: null,
              value: getAccessorName(segment),
            },
          ],
        },
        property: {
          type: "Identifier",
          name: /** @type {import("estree-sentry").PublicKeyName} */ (
            getAccessorKind(segment)
          ),
        },
      }
    : {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object,
        property: {
          type: "Identifier",
          name: /** @type {import("estree-sentry").PublicKeyName} */ (segment),
        },
      };

/**
 * @type {(
 *   name: Exclude<
 *     import("../lang/syntax.d.ts").Intrinsic,
 *     import("../lang/syntax.d.ts").AranIntrinsic
 *   >,
 * ) => import("./layout.d.ts").Layout}
 */
export const makeBuiltinLayout = (name) => ({
  name,
  dependencies: [],
  setup: [],
  value: reduce(splitIntrinsic(name), makeMemberExpression, {
    type: "Identifier",
    name: global_object_parameter,
  }),
});
