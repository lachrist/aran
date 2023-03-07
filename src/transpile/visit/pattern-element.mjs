import {
  makeLiteralExpression,
  makeApplyExpression,
} from "../../ast/index.mjs";
import {
  makeArrayFromExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import { makeScopeMetaReadExpression } from "../scope/index.mjs";
import { annotateNodeArray, visit } from "./context.mjs";

export default {
  __ANNOTATE__: annotateNodeArray,
  RestElement: (node, context, site) =>
    visit(node.argument, context, {
      ...PATTERN,
      kind: site.kind,
      right: makeArrayFromExpression(
        makeScopeMetaReadExpression(context, site.iterator_variable),
      ),
    }),
  __DEFAULT__: (node, context, site) =>
    visit(node, context, {
      ...PATTERN,
      kind: site.kind,
      right: makeApplyExpression(
        makeGetExpression(
          makeScopeMetaReadExpression(context, site.iterator_variable),
          makeLiteralExpression("next"),
        ),
        makeScopeMetaReadExpression(context, site.iterator_variable),
        [],
      ),
    }),
};
