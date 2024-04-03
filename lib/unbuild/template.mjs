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
import { mapSequence, filterSequence, listenSequence } from "./sequence.mjs";
import { drillVeryDeepSite } from "./site.mjs";

const getData = compileGet("data");

/**
 * @type {(
 *   template: import("./template").Template,
 * ) => [import("./variable").MetaVariable, aran.Isolate]}
 */
const declareTemplate = ({ variable }) => [
  variable,
  { type: "intrinsic", intrinsic: "aran.deadzone" },
];

/**
 * @type {(
 *   site: import("./site").Site<estree.TemplateElement>,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildQuasi = ({ node, path }, { cooked }) =>
  makePrimitiveExpression(
    cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
    path,
  );

/**
 * @type {(
 *   template: import("./template").Template,
 * ) => aran.Statement<unbuild.Atom>}
 */
const unbuildTemplate = ({ variable, value: { node, path, meta } }) =>
  makeEffectStatement(
    makeWriteEffect(
      variable,
      makeApplyExpression(
        makeIntrinsicExpression("Object.freeze", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeApplyExpression(
            makeIntrinsicExpression("Object.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
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
                    makePrimitiveExpression({ undefined: null }, path),
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
 *   node: import("./sequence").Sequence<
 *     P,
 *     aran.Program<unbuild.Atom>,
 *   >,
 * ) => import("./prelude").TemplatePrelude extends P
 *   ?  import("./sequence").Sequence<
 *     Exclude<P, import("./prelude").TemplatePrelude>,
 *     aran.Program<unbuild.Atom>,
 *   >
 *   : unknown
 * }
 */
export const incorporateTemplateProgram = (node) =>
  mapSequence(
    filterSequence(node, isNotTemplatePrelude),
    ({ sort, head, body, tag }) =>
      makeProgram(
        sort,
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
