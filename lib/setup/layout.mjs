import { INTRINSIC_RECORD, isAranIntrinsic } from "../lang/index.mjs";
import { map, compileGet, flatenTree, listKey } from "../util/index.mjs";
import { makeBuiltinLayout } from "./builtin.mjs";
import { listDeclareDependencyStatement } from "./dependency.mjs";
import { makeExtraLayout } from "./extra.mjs";
import { global_object_parameter } from "./global.mjs";

const INTRINSIC_ENUM = listKey(INTRINSIC_RECORD);

const getSetup = compileGet("setup");

const getDependencies = compileGet("dependencies");

/**
 * @type {(
 *   propert: {
 *     name: string,
 *     value: import("estree-sentry").Expression<{}>,
 *   },
 * ) => import("estree-sentry").ObjectProperty<{}>}
 */
const makeProperty = ({ name, value }) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: true,
  key: {
    type: "Literal",
    raw: null,
    bigint: null,
    regex: null,
    value: name,
  },
  value,
});

/**
 * @type {(
 *   config: {
 *     directive: boolean,
 *   },
 *   layouts: import("./layout.d.ts").Layout[],
 * ) => import("estree-sentry").Expression<{}>}
 */
const assemble = ({ directive }, layouts) => ({
  type: "ArrowFunctionExpression",
  id: null,
  async: false,
  generator: false,
  expression: false,
  params: [{ type: "Identifier", name: global_object_parameter }],
  body: {
    type: "BlockStatement",
    body: flatenTree([
      directive
        ? {
            type: "ExpressionStatement",
            directive: /** @type {import("estree-sentry").Directive} */ (
              "use strict"
            ),
            expression: {
              type: "Literal",
              value: "use strict",
              raw: null,
              bigint: null,
              regex: null,
            },
          }
        : null,
      listDeclareDependencyStatement(map(layouts, getDependencies)),
      map(layouts, getSetup),
      {
        type: "ReturnStatement",
        argument: {
          type: "ObjectExpression",
          properties: map(layouts, makeProperty),
        },
      },
    ]),
  },
});

/**
 * @type {(
 *   name: import("../lang/syntax.d.ts").Intrinsic,
 * ) => import("./layout.d.ts").Layout}
 */
const makeLayout = (name) =>
  isAranIntrinsic(name) ? makeExtraLayout(name) : makeBuiltinLayout(name);

/**
 * @type {(
 *   config: {
 *     directive: boolean,
 *   },
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeIntrinsicArrow = (config) =>
  assemble(config, map(INTRINSIC_ENUM, makeLayout));
