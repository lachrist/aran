import { compileGet, filterNarrow, map, mapIndex } from "../util/index.mjs";
import {
  makeArrayExpression,
  makeDataDescriptorExpression,
} from "./intrinsic.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  makePrimitiveExpression,
  makeEffectStatement,
  makeWriteEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makeClosureBlock,
  makeProgram,
} from "./node.mjs";
import { isTemplatePrelude, isNotTemplatePrelude } from "./prelude.mjs";
import { mapSequence, filterSequence, listenSequence } from "../sequence.mjs";
import { drillVeryDeepSite } from "./site.mjs";

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
 *   site: import("./site").Site<import("../estree").TemplateElement>,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("./atom").Expression}
 */
export const unbuildQuasi = ({ node, path }, { cooked }) => {
  if (cooked) {
    if (node.value.cooked == null) {
      return makeIntrinsicExpression("undefined", path);
    } else {
      return makePrimitiveExpression(node.value.cooked, path);
    }
  } else {
    return makePrimitiveExpression(node.value.raw, path);
  }
};

/**
 * @type {(
 *   template: import("./template").Template,
 * ) => import("./atom").Statement}
 */
const unbuildTemplate = ({ variable, value: { node, path, meta } }) =>
  makeEffectStatement(
    makeWriteEffect(
      variable,
      makeApplyExpression(
        makeIntrinsicExpression("Object.freeze", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeApplyExpression(
            makeIntrinsicExpression("Object.defineProperty", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeArrayExpression(
                mapIndex(node.quasi.quasis.length, (index) =>
                  unbuildQuasi(
                    drillVeryDeepSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "quasi",
                      "quasis",
                      index,
                    ),
                    { cooked: true },
                  ),
                ),
                path,
              ),
              makePrimitiveExpression("raw", path),
              makeDataDescriptorExpression(
                {
                  value: makeApplyExpression(
                    makeIntrinsicExpression("Object.freeze", path),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeArrayExpression(
                        mapIndex(node.quasi.quasis.length, (index) =>
                          unbuildQuasi(
                            drillVeryDeepSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "quasi",
                              "quasis",
                              index,
                            ),
                            { cooked: false },
                          ),
                        ),
                        path,
                      ),
                    ],
                    path,
                  ),
                  writable: false,
                  enumerable: false,
                  configurable: false,
                },
                path,
              ),
            ],
            path,
          ),
        ],
        path,
      ),
      path,
    ),
    path,
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").Program,
 *   >,
 * ) => import("./prelude").TemplatePrelude extends P
 *   ?  import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").TemplatePrelude>,
 *     import("./atom").Program,
 *   >
 *   : unknown
 * }
 */
export const incorporateTemplateProgram = (node) =>
  mapSequence(
    filterSequence(node, isNotTemplatePrelude),
    ({ kind, situ, head, body, tag }) =>
      makeProgram(
        kind,
        situ,
        head,
        makeClosureBlock(
          [
            ...map(
              map(
                filterNarrow(listenSequence(node), isTemplatePrelude),
                getData,
              ),
              declareTemplate,
            ),
            ...body.frame,
          ],
          [
            ...map(
              map(
                filterNarrow(listenSequence(node), isTemplatePrelude),
                getData,
              ),
              unbuildTemplate,
            ),
            ...body.body,
          ],
          body.completion,
          body.tag,
        ),
        tag,
      ),
  );
