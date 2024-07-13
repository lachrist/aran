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
} from "../../util/index.mjs";
import {
  isBaseDeclarationPrelude,
  isErrorPrelude,
  isHeaderPrelude,
  isIncorporateBlockPrelude,
  isMetaDeclarationPrelude,
  isNotPrefixPrelude,
  isPrefixPrelude,
  isPrivatePrelude,
  isProgramPrelude,
  isTemplatePrelude,
} from "./prelude.mjs";
import {
  filterSequence,
  listenSequence,
  mapSequence,
} from "../../sequence.mjs";
import { makePreludeErrorStatement } from "./error.mjs";
import { makePreludeTemplateStatement } from "./template.mjs";
import { makeApplyExpression, makePrimitiveExpression } from "../../node.mjs";

const getData = compileGet("data");

/**
 * @type {(
 *   template: import("./template.js").Template,
 * ) => [
 *   import("../variable.js").MetaVariable,
 *   import("../../lang.js").Intrinsic,
 * ]}
 */
const declareTemplate = ({ variable }) => [variable, "aran.deadzone"];

/**
 * @type {(
 *   keys: import("../../estree.js").PrivateKey[],
 *   path: import("../../path.js").Path,
 * ) => import("../atom.js").Effect[]}
 */
const listCheckPrivateEffect = (keys, path) => {
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
 *   node: import("../../sequence.js").Sequence<
 *     import("./index.js").BlockPrelude,
 *     import("../atom.js").Program,
 *   >,
 *   options: {
 *     base: import("../../path.js").Path,
 *     root: import("../../estree.js").Program,
 *     early_syntax_error: "embed" | "throw",
 *   },
 * ) => import("../../sequence.js").Sequence<
 *     import("./index.js").ProgramPrelude,
 *     import("../atom.js").Program,
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
            ...map(
              listCheckPrivateEffect(
                map(
                  filterNarrow(listenSequence(node), isPrivatePrelude),
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
 * @type {<P extends import("./index.js").Prelude>(
 *   node: import("../../sequence.js").Sequence<
 *     P,
 *     import("../atom.js").ControlBlock,
 *   >,
 *   path: import("../../path.js").Path,
 * ) => import("../../sequence.js").Sequence<
 *   Exclude<P, (
 *     | import("./index.js").PrefixPrelude
 *     | import("./index.js").DeclarationPrelude
 *   )>,
 *   import("../atom.js").ControlBlock,
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
 * @type {<P extends import("./index.js").Prelude>(
 *   node: import("../../sequence.js").Sequence<
 *     P,
 *     import("../atom.js").RoutineBlock,
 *   >,
 *   path: import("../../path.js").Path,
 * ) => import("../../sequence.js").Sequence<
 *   Exclude<P, (
 *     | import("./index.js").PrefixPrelude
 *     | import("./index.js").DeclarationPrelude
 *   )>,
 *   import("../atom.js").RoutineBlock,
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
 * @type {<P extends import("./index.js").Prelude>(
 *   node: import("../../sequence.js").Sequence<
 *     P,
 *     import("../atom.js").Statement[],
 *   >,
 *   path: import("../../path.js").Path,
 * ) => import("./index.js").PrefixPrelude extends P
 *   ? import("../../sequence.js").Sequence<
 *     Exclude<P, import("./index.js").PrefixPrelude>,
 *     import("../atom.js").Statement[],
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
 * @type {<P extends import("./index.js").Prelude>(
 *   node: import("../../sequence.js").Sequence<
 *     P,
 *     import("../atom.js").Effect[],
 *   >,
 *   path: import("../../path.js").Path,
 * ) => import("./index.js").PrefixPrelude extends P
 *   ? import("../../sequence.js").Sequence<
 *     Exclude<P, import("./index.js").PrefixPrelude>,
 *     import("../atom.js").Effect[],
 *   >
 *   : unknown}
 */
export const incorporateEffect = (node, _path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends import("./index.js").Prelude>(
 *   node: import("../../sequence.js").Sequence<
 *     P,
 *     import("../atom.js").Expression,
 *   >,
 *   path: import("../../path.js").Path,
 * ) => import("./index.js").PrefixPrelude extends P
 *   ? import("../../sequence.js").Sequence<
 *     Exclude<P, import("./index.js").PrefixPrelude>,
 *     import("../atom.js").Expression,
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
 * @type {<P extends import("./index.js").Prelude>(
 *   node: import("../../sequence.js").Sequence<
 *     P,
 *     [
 *       import("../atom.js").Expression,
 *       import("../atom.js").Expression,
 *     ],
 *   >,
 *   path: import("../../path.js").Path,
 * ) => import("./index.js").PrefixPrelude extends P
 *   ? import("../../sequence.js").Sequence<
 *     Exclude<P, import("./index.js").PrefixPrelude>,
 *     [
 *       import("../atom.js").Expression,
 *       import("../atom.js").Expression,
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
