import { AranError } from "../error.mjs";
import {
  compileGet,
  every,
  filterNarrow,
  map,
  mapIndex,
} from "../util/index.mjs";
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
} from "./node.mjs";
import {
  isNotTemplatePrelude,
  isTemplatePrelude,
  makeMetaDeclarationPrelude,
  makeTemplatePrelude,
} from "./prelude.mjs";
import { prependSequence } from "./sequence.mjs";
import { drillVeryDeepSite } from "./site.mjs";

/**
 * @type {(
 *   site: import("./site").Site<estree.TemplateElement>,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("./sequence").ExpressionSequence}
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
 * ) => import("./sequence").StatementSequence}
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

// TODO: this is not the same abstraction level as the rest of this file.
// TODO: It might be better to somehow move this logic in `sequence.mjs`.
/**
 * @type {<P extends import("./prelude").Prelude>(
 *   body: import("./sequence").Sequence<
 *     P,
 *     import("./body").ClosureBody<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").Sequence<
 *   Exclude<P, import("./prelude").TemplatePrelude>,
 *   import("./body").ClosureBody<unbuild.Atom>,
 * >}
 */
export const setupTemplate = (body) => {
  const { head, tail } = concatStatement(
    map(
      map(filterNarrow(body.head, isTemplatePrelude), getData),
      unbuildTemplate,
    ),
  );
  if (every(head, isNotTemplatePrelude)) {
    return {
      // TODO: fine grain sequence
      head: /** @type {any} */ ([
        ...head,
        ...filterNarrow(body.head, isNotTemplatePrelude),
      ]),
      tail: {
        content: [...tail, ...body.tail.content],
        completion: body.tail.completion,
      },
    };
  } else {
    throw new AranError("recursive template prelude");
  }
};
