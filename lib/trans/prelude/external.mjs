import { EMPTY, some } from "../../util/index.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";

/**
 * @type {(
 *   kind: import("../scope/variable/root/index.d.ts").RootKind,
 * ) => boolean}
 */
const isRecordKind = (kind) =>
  kind === "let" || kind === "const" || kind === "class";

/**
 * @type {(
 *   kind: import("../scope/variable/root/index.d.ts").RootKind,
 * ) => boolean}
 */
const isNearFunctionKind = (kind) =>
  kind === "function-strict" || kind === "function-sloppy-near";

/**
 * @type {(
 *   duplicate: import("./external.d.ts").ReifyExternal,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>}
 */
export const listReifyExternalStatement = ({
  dynamic,
  variable,
  origin,
  kinds,
}) => {
  const message = `Duplicate variable: '${variable}' at ${origin}`;
  // Could also be options.base?
  const path = origin;
  return [
    makeEffectStatement(
      makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.has", path),
          makeIntrinsicExpression("undefined", path),
          [
            makeIntrinsicExpression("aran.global_declarative_record", path),
            makePrimitiveExpression(variable, path),
          ],
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression("SyntaxError", message, path),
            path,
          ),
        ],
        EMPTY,
        path,
      ),
      path,
    ),
    some(kinds, isRecordKind)
      ? makeEffectStatement(
          makeConditionalEffect(
            makeConditionalExpression(
              makeApplyExpression(
                // Reflect.getOwnPropertyDescriptor instead of Object.hasOwn
                // https://github.com/nodejs/node/issues/52720
                makeIntrinsicExpression(
                  "Reflect.getOwnPropertyDescriptor",
                  path,
                ),
                makeIntrinsicExpression("undefined", path),
                [
                  makeIntrinsicExpression("aran.global_object", path),
                  makePrimitiveExpression(variable, path),
                ],
                path,
              ),
              makeApplyExpression(
                makeIntrinsicExpression("aran.getValueProperty", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression(
                      "Reflect.getOwnPropertyDescriptor",
                      path,
                    ),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeIntrinsicExpression("aran.global_object", path),
                      makePrimitiveExpression(variable, path),
                    ],
                    path,
                  ),
                  makePrimitiveExpression("configurable", path),
                ],
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
            EMPTY,
            [
              makeExpressionEffect(
                makeThrowErrorExpression("SyntaxError", message, path),
                path,
              ),
            ],
            path,
          ),
          path,
        )
      : dynamic
        ? null
        : some(kinds, isNearFunctionKind)
          ? makeEffectStatement(
              makeConditionalEffect(
                // Reflect.getOwnPropertyDescriptor(global, "foo")
                //   ? Reflect.get(Reflect.getOwnPropertyDescriptor(global, "foo"), "configurable")
                //     ? true
                //     : hasOwn(Reflect.getOwnPropertyDescriptor(global, "foo"), "value")
                //       ? Reflect.get(
                //           Reflect.getOwnPropertyDescriptor(global, "foo"),
                //           "enumerable",
                //         )
                //       : false
                //   : true;
                makeConditionalExpression(
                  makeApplyExpression(
                    // Reflect.getOwnPropertyDescriptor instead of Object.hasOwn
                    // https://github.com/nodejs/node/issues/52720
                    makeIntrinsicExpression(
                      "Reflect.getOwnPropertyDescriptor",
                      path,
                    ),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeIntrinsicExpression("aran.global_object", path),
                      makePrimitiveExpression(variable, path),
                    ],
                    path,
                  ),
                  makeConditionalExpression(
                    makeApplyExpression(
                      makeIntrinsicExpression("aran.getValueProperty", path),
                      makeIntrinsicExpression("undefined", path),
                      [
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.getOwnPropertyDescriptor",
                            path,
                          ),
                          makeIntrinsicExpression("undefined", path),
                          [
                            makeIntrinsicExpression("aran.global_object", path),
                            makePrimitiveExpression(variable, path),
                          ],
                          path,
                        ),
                        makePrimitiveExpression("configurable", path),
                      ],
                      path,
                    ),
                    makePrimitiveExpression(true, path),
                    makeConditionalExpression(
                      makeApplyExpression(
                        makeIntrinsicExpression("Object.hasOwn", path),
                        makeIntrinsicExpression("undefined", path),
                        [
                          makeApplyExpression(
                            makeIntrinsicExpression(
                              "Reflect.getOwnPropertyDescriptor",
                              path,
                            ),
                            makeIntrinsicExpression("undefined", path),
                            [
                              makeIntrinsicExpression(
                                "aran.global_object",
                                path,
                              ),
                              makePrimitiveExpression(variable, path),
                            ],
                            path,
                          ),
                          makePrimitiveExpression("value", path),
                        ],
                        path,
                      ),
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.getValueProperty", path),
                        makeIntrinsicExpression("undefined", path),
                        [
                          makeApplyExpression(
                            makeIntrinsicExpression(
                              "Reflect.getOwnPropertyDescriptor",
                              path,
                            ),
                            makeIntrinsicExpression("undefined", path),
                            [
                              makeIntrinsicExpression(
                                "aran.global_object",
                                path,
                              ),
                              makePrimitiveExpression(variable, path),
                            ],
                            path,
                          ),
                          makePrimitiveExpression("enumerable", path),
                        ],
                        path,
                      ),
                      makePrimitiveExpression(false, path),
                      path,
                    ),
                    path,
                  ),
                  makePrimitiveExpression(true, path),
                  path,
                ),
                EMPTY,
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression("SyntaxError", message, path),
                    path,
                  ),
                ],
                path,
              ),
              path,
            )
          : null,
  ];
};

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>}
 */
export const listPreludeReifyExternalStatement = (prelude) =>
  prelude.type === "external-reify"
    ? listReifyExternalStatement(prelude.data)
    : null;
