import {
  makeRoutineBlock,
  makeSegmentBlock,
  makeEffectStatement,
  makeSequenceExpression,
  makeProgram,
  makeExpressionEffect,
  makeReadExpression,
  makeIntrinsicExpression,
} from "../node.mjs";
import {
  map,
  tuple2,
  concatXX,
  removeDuplicate,
  join,
  filterMapTree,
  filterNarrowTree,
  flatenTree,
} from "../../util/index.mjs";
import {
  getPreludeDeclarationBinding,
  getPreludeHeader,
  getPreludeNativeExternalVariable,
  getPreludePrefixEffect,
  getPreludePrefixStatement,
  getPreludePrivateKey,
  isIncorporateBlockPrelude,
  isNotPrefixPrelude,
  isProgramPrelude,
} from "./prelude.mjs";
import {
  makeApplyExpression,
  makePrimitiveExpression,
} from "../../lang/index.mjs";
import {
  getPreludeTemplateBinding,
  getPreludeTemplateStatement,
} from "./template.mjs";
import { listPreludeReifyExternalStatement } from "./external.mjs";

/**
 * @type {(
 *   variables: import("estree-sentry").VariableName[],
 *   hash: import("../hash").Hash,
 * ) => import("../../util/tree").Tree<import("../atom").Statement>}
 */
const listNativeExternalStatement = (variables, hash) => {
  if (variables.length === 0) {
    return null;
  } else {
    return makeEffectStatement(
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("aran.declareGlobalVariable", hash),
          makeIntrinsicExpression("undefined", hash),
          [makePrimitiveExpression(join(variables, ", "), hash)],
          hash,
        ),
        hash,
      ),
      hash,
    );
  }
};

/**
 * @type {(
 *   keys: import("estree-sentry").PrivateKeyName[],
 *   hash: import("../hash").Hash,
 * ) => import("../../util/tree").Tree<import("../atom").Statement>}
 */
const listPreludePrivateStatement = (keys, hash) => {
  if (keys.length === 0) {
    return null;
  } else {
    return makeEffectStatement(
      makeExpressionEffect(
        makeApplyExpression(
          makeReadExpression("private.check", hash),
          makeIntrinsicExpression("undefined", hash),
          map(removeDuplicate(keys), (key) =>
            makePrimitiveExpression(key, hash),
          ),
          hash,
        ),
        hash,
      ),
      hash,
    );
  }
};

/**
 * @type {(
 *   node: import("../../util/sequence").Sequence<
 *     import("./index").BlockPrelude,
 *     import("../atom").Program,
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("../../util/sequence").Sequence<
 *     import("./index").ProgramPrelude,
 *     import("../atom").Program,
 *   >}
 */
export const incorporateProgram = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isProgramPrelude),
  value: makeProgram(
    value.kind,
    value.situ,
    concatXX(
      /** @type {import("../../lang/header").Header[]} */ (value.head),
      filterMapTree(write, getPreludeHeader),
    ),
    makeRoutineBlock(
      concatXX(
        filterMapTree(write, getPreludeTemplateBinding),
        value.body.bindings,
      ),
      null,
      flatenTree([
        filterMapTree(write, listPreludeReifyExternalStatement),
        listNativeExternalStatement(
          filterMapTree(write, getPreludeNativeExternalVariable),
          hash,
        ),
        listPreludePrivateStatement(
          filterMapTree(write, getPreludePrivateKey),
          hash,
        ),
        filterMapTree(write, getPreludeTemplateStatement),
        value.body.body,
      ]),
      value.body.tail,
      value.body.tag,
    ),
    value.tag,
  ),
});

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     import("../atom").TreeSegmentBlock,
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("../../util/sequence").Sequence<
 *   Exclude<P, (
 *     | import("./index").PrefixPrelude
 *     | import("./index").DeclarationPrelude
 *   )>,
 *   import("../atom").SegmentBlock,
 * >}
 */
export const incorporateSegmentBlock = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isIncorporateBlockPrelude),
  value: makeSegmentBlock(
    flatenTree(value.labels),
    concatXX(
      filterMapTree(write, getPreludeDeclarationBinding),
      value.bindings,
    ),
    flatenTree([
      filterMapTree(write, (prelude) =>
        getPreludePrefixStatement(prelude, hash),
      ),
      value.body,
    ]),
    value.tag,
  ),
});

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     import("../atom").TreeRoutineBlock,
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("../../util/sequence").Sequence<
 *   Exclude<P, (
 *     | import("./index").PrefixPrelude
 *     | import("./index").DeclarationPrelude
 *   )>,
 *   import("../atom").RoutineBlock,
 * >}
 */
export const incorporateRoutineBlock = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isIncorporateBlockPrelude),
  value: makeRoutineBlock(
    concatXX(
      filterMapTree(write, getPreludeDeclarationBinding),
      value.bindings,
    ),
    value.head === null
      ? null
      : flatenTree([filterMapTree(write, getPreludePrefixEffect), value.head]),
    value.head === null
      ? flatenTree([
          filterMapTree(write, (prelude) =>
            getPreludePrefixStatement(prelude, hash),
          ),
          value.body,
        ])
      : flatenTree(value.body),
    value.tail,
    value.tag,
  ),
});

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     import("../../util/tree").Tree<import("../atom").Statement>,
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../util/sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../../util/tree").Tree<import("../atom").Statement>,
 *   >
 *   : unknown}
 */
export const incorporateStatement = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isNotPrefixPrelude),
  value: [
    filterMapTree(write, (prelude) => getPreludePrefixStatement(prelude, hash)),
    value,
  ],
});

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../util/sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *   >
 *   : unknown}
 */
export const incorporateEffect = ({ write, value }, _hash) => ({
  write: filterNarrowTree(write, isNotPrefixPrelude),
  value: [filterMapTree(write, getPreludePrefixEffect), value],
});

/**
 * @type {<X, P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     [
 *       import("../../util/tree").Tree<import("../atom").Effect>,
 *       X,
 *     ],
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../util/sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     [
 *       import("../../util/tree").Tree<import("../atom").Effect>,
 *       X,
 *     ],
 *   >
 *   : unknown}
 */
export const incorporateFirstEffect = ({ write, value }, _hash) => ({
  write: filterNarrowTree(write, isNotPrefixPrelude),
  value: tuple2(
    [filterMapTree(write, getPreludePrefixEffect), value[0]],
    value[1],
  ),
});

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     import("../atom").Expression,
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("../../util/sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Expression,
 *   >}
 */
export const incorporateExpression = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isNotPrefixPrelude),
  value: makeSequenceExpression(
    filterMapTree(write, getPreludePrefixEffect),
    value,
    hash,
  ),
});

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../util/sequence").Sequence<
 *     P,
 *     [
 *       import("../atom").Expression,
 *       import("../atom").Expression,
 *     ],
 *   >,
 *   hash: import("../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../util/sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     [
 *       import("../atom").Expression,
 *       import("../atom").Expression,
 *     ],
 *   >
 *   : unknown}
 */
export const incorporateExpressionPair = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isNotPrefixPrelude),
  value: tuple2(
    makeSequenceExpression(
      filterMapTree(write, getPreludePrefixEffect),
      value[0],
      hash,
    ),
    value[1],
  ),
});
