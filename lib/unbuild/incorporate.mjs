import {
  makeRoutineBlock,
  makeControlBlock,
  makeEffectStatement,
  makeSequenceExpression,
  makeProgram,
} from "./node.mjs";
import {
  filterNarrow,
  map,
  compileGet,
  pairup,
  concatXX,
  concatXXX,
  flatMap,
} from "../util/index.mjs";
import {
  isBaseDeclarationPrelude,
  isEarlyErrorPrelude,
  isHeaderPrelude,
  isIncorporateBlockPrelude,
  isMetaDeclarationPrelude,
  isNotPrefixPrelude,
  isPrefixPrelude,
  isProgramPrelude,
  isTemplatePrelude,
} from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "../sequence.mjs";
import {
  isDynamicEarlyError,
  isStaticEarlyError,
  reportDynamicEarlyError,
  reportStaticEarlyError,
} from "./early-error.mjs";
import { unbuildTemplate } from "./template.mjs";

const getData = compileGet("data");

/**
 * @type {(
 *   template: import("./template").Template,
 * ) => [
 *   import("./variable").MetaVariable,
 *   import("../lang").Intrinsic,
 * ]}
 */
const declareTemplate = ({ variable }) => [variable, "aran.deadzone"];

/**
 * @type {(
 *   node: import("../sequence").Sequence<
 *     import("./prelude").BlockPrelude,
 *     import("./atom").Program,
 *   >,
 *   options: {
 *     base: import("../path").Path,
 *     root: import("../estree").Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../sequence").Sequence<
 *     import("./prelude").ProgramPrelude,
 *     import("./atom").Program,
 *   >}
 */
export const incorporateProgram = (node, options) => {
  const errors = map(
    filterNarrow(listenSequence(node), isEarlyErrorPrelude),
    getData,
  );
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
            ...map(filterNarrow(errors, isStaticEarlyError), (error) =>
              reportStaticEarlyError(error, options),
            ),
            ...flatMap(filterNarrow(errors, isDynamicEarlyError), (error) =>
              reportDynamicEarlyError(error, options),
            ),
            ...map(
              map(
                filterNarrow(listenSequence(node), isTemplatePrelude),
                getData,
              ),
              unbuildTemplate,
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
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").ControlBlock,
 *   >,
 *   path: import("../path").Path,
 * ) => import("../sequence").Sequence<
 *   Exclude<P, (
 *     | import("./prelude").PrefixPrelude
 *     | import("./prelude").DeclarationPrelude
 *   )>,
 *   import("./atom").ControlBlock,
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
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").RoutineBlock,
 *   >,
 *   path: import("../path").Path,
 * ) => import("../sequence").Sequence<
 *   Exclude<P, (
 *     | import("./prelude").PrefixPrelude
 *     | import("./prelude").DeclarationPrelude
 *   )>,
 *   import("./atom").RoutineBlock,
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
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").Statement[],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").Statement[],
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
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").Effect[],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").Effect[],
 *   >
 *   : unknown}
 */
export const incorporateEffect = (node, _path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").Expression,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").Expression,
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
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     [
 *       import("./atom").Expression,
 *       import("./atom").Expression,
 *     ],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     [
 *       import("./atom").Expression,
 *       import("./atom").Expression,
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
