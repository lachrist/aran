import { AranError } from "../../../test/262/error.mjs";
import { drill } from "../../drill.mjs";
import { AranTypeError } from "../../util/error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
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

const BASENAME = /** @type {__basename} */ ("property");

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
 *   options: null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildProtoProperty = ({ node, path }, context) => {
  if (isObjectProperty(node)) {
    return unbuildExpression(drill({ node, path }, "value"), context, {
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
 * @type {<X>(value: X | null, message: string) => X}
 */
const fromJust = (value, message) => {
  if (value === null) {
    throw new AranError(message);
  } else {
    return value;
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
 *     self: unbuild.Variable | null,
 *   },
 * ) => {
 *   setup: (aran.Effect<unbuild.Atom>)[],
 *   key: (aran.Expression<unbuild.Atom>),
 *   value: (aran.Expression<unbuild.Atom>),
 * }}
 */
const unbuildCommonProperty = ({ node, path }, context, { self }) => {
  if (isObjectProperty(node)) {
    const key = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("key"),
      path,
    );
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
          base: key,
        };
    const value = isMethodProperty(node)
      ? isFunctionProperty(node)
        ? unbuildFunction(drill({ node, path }, "value"), context, {
            type: "method",
            name,
            self: fromJust(self, "self should have been provided"),
          })
        : makeSyntaxErrorExpression(
            `Illegal method value: ${node.value.type}`,
            path,
          )
      : unbuildExpression(drill({ node, path }, "value"), context, { name });
    return node.computed
      ? {
          setup: [
            makeWriteEffect(
              key,
              unbuildKeyExpression(drill({ node, path }, "key"), context, node),
              true,
              path,
            ),
          ],
          key: makeReadExpression(key, path),
          value,
        }
      : {
          setup: [],
          key: unbuildKeyExpression(
            drill({ node, path }, "key"),
            context,
            node,
          ),
          value,
        };
  } else {
    return {
      setup: [],
      key: unbuildKeyExpression(drill({ node, path }, "key"), context, node),
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
 *   options: { self: unbuild.Variable | null },
 * ) => [
 *   aran.Expression<unbuild.Atom>,
 *   aran.Expression<unbuild.Atom>,
 * ]}
 */
export const unbuildInitProperty = ({ node, path }, context, { self }) => {
  if (isObjectProperty(node)) {
    const { setup, key, value } = unbuildCommonProperty(
      { node, path },
      context,
      { self },
    );
    return [makeLongSequenceExpression(setup, key, path), value];
  } else {
    return [
      unbuildKeyExpression(drill({ node, path }, "key"), context, node),
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
 *     self: unbuild.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildProperty = ({ node, path }, context, { self }) => {
  switch (node.type) {
    case "SpreadElement": {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Object.assign", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadExpression(self, path),
              unbuildExpression(drill({ node, path }, "argument"), context, {
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
                  makeReadExpression(self, path),
                  // __proto__ is anonymous:
                  // Reflect.getPrototypeOf({__proto__: () => {} }).name === ""
                  unbuildExpression(drill({ node, path }, "value"), context, {
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
            {
              self,
            },
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
