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
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>}
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
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>}
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
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     import("./index.d.ts").BlockPrelude,
 *     import("../atom.d.ts").Program,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *     import("./index.d.ts").ProgramPrelude,
 *     import("../atom.d.ts").Program,
 *   >}
 */
export const incorporateProgram = ({ write, value }, hash) => ({
  write: filterNarrowTree(write, isProgramPrelude),
  value: makeProgram(
    value.kind,
    value.situ,
    concatXX(
      /** @type {import("../../lang/header.d.ts").Header[]} */ (value.head),
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     import("../atom.d.ts").TreeSegmentBlock,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   Exclude<P, (
 *     | import("./index.d.ts").PrefixPrelude
 *     | import("./index.d.ts").DeclarationPrelude
 *   )>,
 *   import("../atom.d.ts").SegmentBlock,
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     import("../atom.d.ts").TreeRoutineBlock,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   Exclude<P, (
 *     | import("./index.d.ts").PrefixPrelude
 *     | import("./index.d.ts").DeclarationPrelude
 *   )>,
 *   import("../atom.d.ts").RoutineBlock,
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("./index.d.ts").PrefixPrelude extends P
 *   ? import("../../util/sequence.d.ts").Sequence<
 *     Exclude<P, import("./index.d.ts").PrefixPrelude>,
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Statement>,
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("./index.d.ts").PrefixPrelude extends P
 *   ? import("../../util/sequence.d.ts").Sequence<
 *     Exclude<P, import("./index.d.ts").PrefixPrelude>,
 *     import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 *   >
 *   : unknown}
 */
export const incorporateEffect = ({ write, value }, _hash) => ({
  write: filterNarrowTree(write, isNotPrefixPrelude),
  value: [filterMapTree(write, getPreludePrefixEffect), value],
});

/**
 * @type {<X, P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     [
 *       import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
 *       X,
 *     ],
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("./index.d.ts").PrefixPrelude extends P
 *   ? import("../../util/sequence.d.ts").Sequence<
 *     Exclude<P, import("./index.d.ts").PrefixPrelude>,
 *     [
 *       import("../../util/tree.d.ts").Tree<import("../atom.d.ts").Effect>,
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     import("../atom.d.ts").Expression,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *     Exclude<P, import("./index.d.ts").PrefixPrelude>,
 *     import("../atom.d.ts").Expression,
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   node: import("../../util/sequence.d.ts").Sequence<
 *     P,
 *     [
 *       import("../atom.d.ts").Expression,
 *       import("../atom.d.ts").Expression,
 *     ],
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("./index.d.ts").PrefixPrelude extends P
 *   ? import("../../util/sequence.d.ts").Sequence<
 *     Exclude<P, import("./index.d.ts").PrefixPrelude>,
 *     [
 *       import("../atom.d.ts").Expression,
 *       import("../atom.d.ts").Expression,
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
