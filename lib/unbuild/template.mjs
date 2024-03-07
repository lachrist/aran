import { compileGet, filterNarrow, map, mapIndex } from "../util/index.mjs";
import {
  makeArrayExpression,
  makeDataDescriptorExpression,
} from "./intrinsic.mjs";
import { mangleConstantMetaVariable } from "./mangle.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  makeReadExpression,
  makeWriteEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeEffectStatement,
  concatStatement,
  prependClosureBody,
} from "./node.mjs";
import {
  isNotTemplatePrelude,
  isTemplatePrelude,
  makeMetaDeclarationPrelude,
  makeTemplatePrelude,
} from "./prelude.mjs";
import {
  filterSequence,
  listenSequence,
  prependSequence,
} from "./sequence.mjs";
import { drillVeryDeepSite } from "./site.mjs";

/**
 * @type {(
 *   site: import("./site").Site<estree.TemplateElement>,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("./sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const unbuildQuasi = ({ node, path }, { cooked }) =>
  makePrimitiveExpression(
    cooked ? node.value.cooked ?? { undefined: null } : node.value.raw,
    path,
  );

/**
 * @type {(
 *   site: import("./site").Site<estree.TaggedTemplateExpression>
 * ) => import("./sequence").ExpressionSequence}
 */
export const cacheTemplate = ({ node, path, meta }) => {
  const variable = mangleConstantMetaVariable(
    forkMeta((meta = nextMeta(meta))),
  );
  return prependSequence(
    [
      makeTemplatePrelude({
        variable,
        value: {
          node,
          path,
          meta: forkMeta((meta = nextMeta(meta))),
        },
      }),
    ],
    makeReadExpression(variable, path),
  );
};

/**
 * @type {(
 *   template: {
 *     variable: import("./variable").MetaVariable,
 *     value: import("./site").Site<estree.TaggedTemplateExpression>,
 *   },
 * ) => import("./sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
const unbuildTemplate = ({ variable, value: { node, path, meta } }) =>
  prependSequence(
    [
      makeMetaDeclarationPrelude([
        variable,
        { type: "intrinsic", intrinsic: "aran.deadzone" },
      ]),
    ],
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
    ),
  );

const getData = compileGet("data");

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   body: import("./sequence").Sequence<
 *     P,
 *     import("./body").ClosureBody<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").Sequence<
 *   Exclude<
 *     P | import("./prelude").MetaDeclarationPrelude,
 *     import("./prelude").TemplatePrelude,
 *   >,
 *   import("./body").ClosureBody<unbuild.Atom>,
 * >}
 */
export const setupTemplate = (body) =>
  prependClosureBody(
    concatStatement(
      map(
        map(filterNarrow(listenSequence(body), isTemplatePrelude), getData),
        unbuildTemplate,
      ),
    ),
    filterSequence(body, isNotTemplatePrelude),
  );
