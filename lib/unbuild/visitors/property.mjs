import { drill } from "../../drill.mjs";
import { AranTypeError } from "../../util/error.mjs";
import { fromJust } from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { forkMeta, mangleMetaVariable, splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import {
  isFunctionProperty,
  isMethodProperty,
  isObjectProperty,
  isPropertyNotComputed,
  isProtoProperty,
} from "../predicate.mjs";
import { DUMMY_KEY, makeSyntaxErrorExpression } from "../report.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildKeyExpression } from "./key.mjs";

const { String } = globalThis;

/**
 * @typedef {{
 *   type: "static",
 *   value: estree.Variable
 * } | {
 *   type: "dynamic",
 *   value: unbuild.Variable
 * }} FunctionName
 */

/** @type {(node: estree.Property & { computed: false }) => estree.Key} */
const getStaticKey = (node) => {
  switch (node.key.type) {
    case "Identifier": {
      return /** @type {estree.Key} */ (node.key.name);
    }
    case "Literal": {
      return /** @type {estree.Key} */ (String(node.value));
    }
    default: {
      return DUMMY_KEY;
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & ({
 *       kind: "init",
 *       method: false,
 *       computed: false,
 *       key: estree.Identifier & { name: "__proto__" },
 *     } | {
 *       kind: "init",
 *       method: false,
 *       computed: true,
 *       key: estree.Literal & { value: "__proto__" },
 *     }),
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = ({ node, path }, context, { meta }) => {
  if (isObjectProperty(node)) {
    return unbuildExpression(drill({ node, path }, "value"), context, {
      meta,
      name: ANONYMOUS,
    });
  } else {
    return makeSyntaxErrorExpression(
      "Illegal pattern in object property",
      path,
    );
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *     self: aran.Expression<unbuild.Atom> | null,
 *   },
 * ) => {
 *   setup: (aran.Effect<unbuild.Atom>)[],
 *   key: (aran.Expression<unbuild.Atom>),
 *   value: (aran.Expression<unbuild.Atom>),
 * }}
 */
const unbuildCommonProperty = ({ node, path }, context, { meta, self }) => {
  if (isObjectProperty(node)) {
    const metas = splitMeta(meta, ["key", "value"]);
    /** @type {import("../name.mjs").Name} */
    const name = isPropertyNotComputed(node)
      ? {
          type: "static",
          kind: node.kind,
          base: getStaticKey(node),
        }
      : {
          type: "dynamic",
          kind: node.kind,
          base: mangleMetaVariable(metas.key),
        };
    const value = isMethodProperty(node)
      ? isFunctionProperty(node)
        ? unbuildFunction(drill({ node, path }, "value"), context, {
            meta: forkMeta(metas.value),
            type: "method",
            name,
            self: fromJust(self, "self should have been provided"),
          })
        : makeSyntaxErrorExpression(
            `Illegal method value: ${node.value.type}`,
            path,
          )
      : unbuildExpression(drill({ node, path }, "value"), context, {
          meta: forkMeta(metas.value),
          name,
        });
    return node.computed
      ? {
          setup: [
            makeWriteEffect(
              mangleMetaVariable(metas.key),
              unbuildKeyExpression(drill({ node, path }, "key"), context, {
                meta: forkMeta(metas.key),
                computed: node.computed,
              }),
              true,
              path,
            ),
          ],
          key: makeReadExpression(mangleMetaVariable(metas.key), path),
          value,
        }
      : {
          setup: [],
          key: unbuildKeyExpression(drill({ node, path }, "key"), context, {
            meta: forkMeta(metas.key),
            computed: node.computed,
          }),
          value,
        };
  } else {
    return {
      setup: [],
      key: unbuildKeyExpression(drill({ node, path }, "key"), context, {
        meta,
        computed: node.computed,
      }),
      value: makeSyntaxErrorExpression(
        "Illegal pattern in object  property",
        path,
      ),
    };
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property & { kind: "init" },
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *     self: unbuild.Variable | null,
 *   },
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
export const unbuildInitProperty = (
  { node, path },
  context,
  { meta, self },
) => {
  if (isObjectProperty(node)) {
    const { setup, key, value } = unbuildCommonProperty(
      { node, path },
      context,
      { meta, self },
    );
    return [makeLongSequenceExpression(setup, key, path), value];
  } else {
    return [
      unbuildKeyExpression(drill({ node, path }, "key"), context, {
        meta,
        computed: node.computed,
      }),
      makeSyntaxErrorExpression("Illegal pattern in object property", path),
    ];
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Property | estree.SpreadElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *     self: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = ({ node, path }, context, { meta, self }) => {
  switch (node.type) {
    case "SpreadElement": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              self,
              unbuildExpression(drill({ node, path }, "argument"), context, {
                meta,
                name: ANONYMOUS,
              }),
            ],
            path,
          ),
          path,
        ),
      ];
    }
    case "Property": {
      if (isObjectProperty(node)) {
        if (isProtoProperty(node)) {
          return [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.setPrototypeOf", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  self,
                  // __proto__ is anonymous:
                  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                  unbuildExpression(drill({ node, path }, "value"), context, {
                    meta,
                    name: ANONYMOUS,
                  }),
                ],
                path,
              ),
              path,
            ),
          ];
        } else {
          const { setup, key, value } = unbuildCommonProperty(
            { node, path },
            context,
            { meta, self },
          );
          return [
            ...setup,
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(self, path),
                  key,
                  node.kind === "init"
                    ? makeDataDescriptorExpression(
                        {
                          value,
                          writable: true,
                          enumerable: true,
                          configurable: true,
                        },
                        path,
                      )
                    : makeAccessorDescriptorExpression(
                        {
                          get: node.kind === "get" ? value : null,
                          set: node.kind === "set" ? value : null,
                          enumerable: true,
                          configurable: true,
                        },
                        path,
                      ),
                ],
                path,
              ),
              path,
            ),
          ];
        }
      } else {
        return [
          makeExpressionEffect(
            makeSyntaxErrorExpression(
              "Illegal pattern in object property",
              path,
            ),
            path,
          ),
        ];
      }
    }
    default: {
      throw new AranTypeError("invalid property", node);
    }
  }
};
