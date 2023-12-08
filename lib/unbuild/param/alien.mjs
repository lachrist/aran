import { guard, hasOwn } from "../../util/index.mjs";
import {
  report,
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeIntrinsicExpression,
} from "../node.mjs";
import {
  STRICT_KEYWORD_RECORD,
  STRICT_READONLY_RECORD,
} from "../../estree.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "global",
 *     kind: "var" | "let",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclareAlienStatement = (
  { path },
  context,
  { kind, variable },
) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("aran.declareGlobal", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makePrimitiveExpression(context.mode, path),
        makePrimitiveExpression(kind, path),
        makePrimitiveExpression(variable, path),
      ],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadAlienExpression = (
  { path },
  context,
  { situ, variable },
) => {
  if (situ === "global" || hasOwn(STRICT_KEYWORD_RECORD, variable)) {
    return guard(
      situ === "local",
      (node) =>
        report(node, {
          name: "KeywordLocalExternalRead",
          message: `Turning local read of '${variable}' into global read.`,
        }),
      makeApplyExpression(
        makeIntrinsicExpression("aran.readGlobal", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makePrimitiveExpression(context.mode, path),
          makePrimitiveExpression(variable, path),
        ],
        path,
      ),
    );
  } else {
    return makeApplyExpression(
      makeReadParameterExpression("scope.read", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(variable, path)],
      path,
    );
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeTypeofAlienExpression = (
  { path },
  context,
  { situ, variable },
) => {
  if (situ === "global" || hasOwn(STRICT_KEYWORD_RECORD, variable)) {
    return guard(
      situ === "local",
      (node) =>
        report(node, {
          name: "KeywordLocalExternalTypeof",
          message: `Turning local typeof of '${variable}' into global typeof.`,
        }),
      makeApplyExpression(
        makeIntrinsicExpression("aran.typeofGlobal", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makePrimitiveExpression(context.mode, path),
          makePrimitiveExpression(variable, path),
        ],
        path,
      ),
    );
  } else {
    return makeApplyExpression(
      makeReadParameterExpression("scope.typeof", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(variable, path)],
      path,
    );
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "local" | "global",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDiscardAlienExpression = (
  { path },
  context,
  { situ, variable },
) =>
  guard(
    situ === "local",
    (node) =>
      report(node, {
        name: "SloppyLocalExternalDiscard",
        message: `Turning local discard of '${variable}' into global discard.`,
      }),
    makeApplyExpression(
      makeIntrinsicExpression("aran.discardGlobal", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makePrimitiveExpression(context.mode, path),
        makePrimitiveExpression(variable, path),
      ],
      path,
    ),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     situ: "global" | "local",
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listWriteAlienEffect = (
  { path },
  context,
  { situ, variable, right },
) => {
  if (
    situ === "global" ||
    hasOwn(STRICT_KEYWORD_RECORD, variable) ||
    hasOwn(STRICT_READONLY_RECORD, variable)
  ) {
    return [
      makeExpressionEffect(
        guard(
          situ === "local",
          (node) =>
            report(node, {
              name: "KeywordLocalExternalWrite",
              message: `Turning sloppy local external write of '${variable}' into strict.`,
            }),
          makeApplyExpression(
            makeIntrinsicExpression("aran.writeGlobal", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(context.mode, path),
              makePrimitiveExpression(variable, path),
              right,
            ],
            path,
          ),
        ),
        path,
      ),
    ];
  } else {
    return [
      makeExpressionEffect(
        guard(
          context.mode === "sloppy",
          (node) =>
            report(node, {
              name: "SloppyLocalExternalWrite",
              message: `Turning sloppy local external write of '${variable}' into strict.`,
            }),
          makeApplyExpression(
            makeReadParameterExpression("scope.typeof", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makePrimitiveExpression(variable, path)],
            path,
          ),
        ),
        path,
      ),
    ];
  }
};
