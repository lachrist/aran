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
  isErrorPrelude,
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
import { makePreludeErrorStatement } from "./error.mjs";
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
 *   keys: import("../../estree").PrivateKey[],
 *   path: import("../../path").Path,
 * ) => import("../atom").Effect[]}
 */
const listPreludePrivateEffect = (keys, path) => {
  if (keys.length === 0) {
    return EMPTY;
  } else {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeReadExpression("private.check", path),
          makeIntrinsicExpression("undefined", path),
          map(removeDuplicate(keys), (key) =>
            makePrimitiveExpression(key, path),
          ),
          path,
        ),
        path,
      ),
    ];
  }
};

/**
 * @type {(
 *   variables: import("../../estree").Variable[],
 *   path: import("../../path").Path,
 * ) => import("../atom").Effect[]}
 */
const listNativeExternalEffect = (variables, path) => {
  if (variables.length === 0) {
    return EMPTY;
  } else {
    return [
      makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("aran.declareGlobal", path),
          makeIntrinsicExpression("undefined", path),
          [makePrimitiveExpression(join(variables, ", "), path)],
          path,
        ),
        path,
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
 *   options: {
 *     base: import("../../path").Path,
 *     root: import("../../estree").Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../../sequence").Sequence<
 *     import("./index").ProgramPrelude,
 *     import("../atom").Program,
 *   >}
 */
export const incorporateProgram = (node, options) =>
  mapSequence(
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
            ...map(
              map(filterNarrow(listenSequence(node), isErrorPrelude), getData),
              (error) => makePreludeErrorStatement(error, options),
            ),
            ...flatMap(
              map(
                filterNarrow(listenSequence(node), isReifyExternalPrelude),
                getData,
              ),
              (external) =>
                listPreludeReifyExternalStatement(external, options),
            ),
            ...map(
              listNativeExternalEffect(
                map(
                  filterNarrow(listenSequence(node), isNativeExternalPrelude),
                  getData,
                ),
                options.base,
              ),
              (node) => makeEffectStatement(node, options.base),
            ),
            ...map(
              listPreludePrivateEffect(
                map(
                  filterNarrow(listenSequence(node), isUnboundPrivatePrelude),
                  getData,
                ),
                options.base,
              ),
              (node) => makeEffectStatement(node, options.base),
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

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").ControlBlock,
 *   >,
 *   path: import("../../path").Path,
 * ) => import("../../sequence").Sequence<
 *   Exclude<P, (
 *     | import("./index").PrefixPrelude
 *     | import("./index").DeclarationPrelude
 *   )>,
 *   import("../atom").ControlBlock,
 * >}
 */
export const incorporateControlBlock = (node, path) =>
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
            (node) => makeEffectStatement(node, path),
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
 *   path: import("../../path").Path,
 * ) => import("../../sequence").Sequence<
 *   Exclude<P, (
 *     | import("./index").PrefixPrelude
 *     | import("./index").DeclarationPrelude
 *   )>,
 *   import("../atom").RoutineBlock,
 * >}
 */
export const incorporateRoutineBlock = (node, path) =>
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
                (node) => makeEffectStatement(node, path),
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
 *   path: import("../../path").Path,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Statement[],
 *   >
 *   : unknown}
 */
export const incorporateStatement = (node, path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      (node) => makeEffectStatement(node, path),
    ),
    ...tail,
  ]);

/**
 * @type {<P extends import("./index").Prelude>(
 *   node: import("../../sequence").Sequence<
 *     P,
 *     import("../atom").Effect[],
 *   >,
 *   path: import("../../path").Path,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Effect[],
 *   >
 *   : unknown}
 */
export const incorporateEffect = (node, _path) =>
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
 *   path: import("../../path").Path,
 * ) => import("./index").PrefixPrelude extends P
 *   ? import("../../sequence").Sequence<
 *     Exclude<P, import("./index").PrefixPrelude>,
 *     import("../atom").Expression,
 *   >
 *   : unknown}
 */
export const incorporateExpression = (node, path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) =>
    makeSequenceExpression(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      tail,
      path,
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
 *   path: import("../../path").Path,
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
export const incorporateExpressionPair = (node, path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) =>
    pairup(
      makeSequenceExpression(
        map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
        tail[0],
        path,
      ),
      tail[1],
    ),
  );
