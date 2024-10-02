import {
  makeRoutineBlock,
  makeControlBlock,
  makeEffectStatement,
  makeSequenceExpression,
  makeProgram,
  makeExpressionEffect,
  makeReadExpression,
  makeIntrinsicExpression,
} from "../node.mjs";
import {
  filterNarrow,
  map,
  compileGet,
  pairup,
  concatXX,
  concatXXX,
  removeDuplicate,
  EMPTY,
  flatMap,
  join,
} from "../../util/index.mjs";
import {
  isBaseDeclarationPrelude,
  isHeaderPrelude,
  isIncorporateBlockPrelude,
  isMetaDeclarationPrelude,
  isNativeExternalPrelude,
  isNotPrefixPrelude,
  isPrefixPrelude,
  isProgramPrelude,
  isReifyExternalPrelude,
  isTemplatePrelude,
  isUnboundPrivatePrelude,
} from "./prelude.mjs";
import {
  filterSequence,
  listenSequence,
  mapSequence,
} from "../../sequence.mjs";
import { makePreludeTemplateStatement } from "./template.mjs";
import { makeApplyExpression, makePrimitiveExpression } from "../../node.mjs";
import { listPreludeReifyExternalStatement } from "./external.mjs";

const getData = compileGet("data");

/**
 * @type {(
 *   template: import("./template").Template,
 * ) => [
 *   import("../variable").MetaVariable,
 *   import("../../lang").Intrinsic,
 * ]}
 */
const declareTemplate = ({ variable }) => [variable, "aran.deadzone"];

/**
 * @type {(
 *   keys: import("estree-sentry").PrivateKeyName[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Effect[]}
 */
const listPreludePrivateEffect = (keys, hash) => {
  if (keys.length === 0) {
    return EMPTY;
  } else {
    return [
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
    ];
  }
};

/**
 * @type {(
 *   variables: import("estree-sentry").VariableName[],
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Effect[]}
 */
const listNativeExternalEffect = (variables, hash) => {
  if (variables.length === 0) {
    return EMPTY;
  } else {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("aran.declareGlobal", hash),
          makeIntrinsicExpression("undefined", hash),
          [makePrimitiveExpression(join(variables, ", "), hash)],
          hash,
        ),
        hash,
      ),
    ];
  }
};

/**
 * @type {(
 *   node: import("../../sequence").Sequence<
 *     import("./index").BlockPrelude,
 *     import("../atom").Program,
 *   >,
 *   root: import("estree-sentry").Program<import("../../hash").HashProp>,
 * ) => import("../../sequence").Sequence<
 *     import("./index").ProgramPrelude,
 *     import("../atom").Program,
 *   >}
 */
export const incorporateProgram = (node, root) => {
  const { _hash: hash } = root;
  return mapSequence(
    filterSequence(node, isProgramPrelude),
    ({ kind, situ, head, body, tag }) =>
      makeProgram(
        kind,
        situ,
        [
          ...head,
          ...map(filterNarrow(listenSequence(node), isHeaderPrelude), getData),
        ],
        makeRoutineBlock(
          [
            ...map(
              map(
                filterNarrow(listenSequence(node), isTemplatePrelude),
                getData,
              ),
              declareTemplate,
            ),
            ...body.bindings,
          ],
          null,
          [
            ...flatMap(
              map(
                filterNarrow(listenSequence(node), isReifyExternalPrelude),
                getData,
              ),
              (external) => listPreludeReifyExternalStatement(external, root),
            ),
            ...map(
              listNativeExternalEffect(
                map(
                  filterNarrow(listenSequence(node), isNativeExternalPrelude),
                  getData,
                ),
                hash,
              ),
              (node) => makeEffectStatement(node, hash),
            ),
            ...map(
              listPreludePrivateEffect(
                map(
                  filterNarrow(listenSequence(node), isUnboundPrivatePrelude),
                  getData,
                ),
                hash,
              ),
              (node) => makeEffectStatement(node, hash),
            ),
            ...map(
              map(
                filterNarrow(listenSequence(node), isTemplatePrelude),
                getData,
              ),
              makePreludeTemplateStatement,
            ),
            ...body.body,
          ],
          body.tail,
          body.tag,
        ),
        tag,
      ),
  );
};

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").ControlBlock,
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("../../sequence").Sequence<
 *   Exclude<P, (
 *     | import("./index").PrefixPrelude
 *     | import("./index").DeclarationPrelude
 *   )>,
 *   import("../atom").ControlBlock,
 * >}
 */
export const incorporateControlBlock = (node, hash) =>
  mapSequence(
    filterSequence(node, isIncorporateBlockPrelude),
    ({ labels, bindings, body, tag }) =>
      makeControlBlock(
        labels,
        concatXXX(
          bindings,
          map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ),
        concatXX(
          map(
            map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
            (node) => makeEffectStatement(node, hash),
          ),
          body,
        ),
        tag,
      ),
  );

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").RoutineBlock,
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("../../sequence").Sequence<
 *   Exclude<P, (
 *     | import("./index").PrefixPrelude
 *     | import("./index").DeclarationPrelude
 *   )>,
 *   import("../atom").RoutineBlock,
 * >}
 */
export const incorporateRoutineBlock = (node, hash) =>
  mapSequence(
    filterSequence(node, isIncorporateBlockPrelude),
    ({ bindings, head, body, tail, tag }) =>
      makeRoutineBlock(
        concatXXX(
          bindings,
          map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ),
        head === null
          ? null
          : concatXX(
              map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
              head,
            ),
        head === null
          ? concatXX(
              map(
                map(
                  filterNarrow(listenSequence(node), isPrefixPrelude),
                  getData,
                ),
                (node) => makeEffectStatement(node, hash),
              ),
              body,
            )
          : body,
        tail,
        tag,
      ),
  );

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").Statement[],
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Statement[],
 *   >
 *   : unknown}
 */
export const incorporateStatement = (node, hash) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      (node) => makeEffectStatement(node, hash),
    ),
    ...tail,
  ]);

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").Effect[],
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Effect[],
 *   >
 *   : unknown}
 */
export const incorporateEffect = (node, _hash) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").Expression,
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Expression,
 *   >
 *   : unknown}
 */
export const incorporateExpression = (node, hash) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) =>
    makeSequenceExpression(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      tail,
      hash,
    ),
  );

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     [
 *       import("../atom").Expression,
 *       import("../atom").Expression,
 *     ],
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     [
 *       import("../atom").Expression,
 *       import("../atom").Expression,
 *     ],
 *   >
 *   : unknown}
 */
export const incorporateExpressionPair = (node, hash) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) =>
    pairup(
      makeSequenceExpression(
        map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
        tail[0],
        hash,
      ),
      tail[1],
    ),
  );
