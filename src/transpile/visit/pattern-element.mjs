import {
  makeLiteralExpression,
  makeApplyExpression,
} from "../../ast/index.mjs";
import {
  makeArrayFromExpression,
  makeGetExpression,
} from "../../intrinsic.mjs";
import { annotateNodeArray } from "./macro.mjs";
import { visit, PATTERN } from "./context.mjs";

export default {
  __ANNOTATE__: annotateNodeArray,
  RestElement: (node, context, site) =>
    visit(node.argument, context, {
      ...PATTERN,
      kind: site.kind,
      right: makeArrayFromExpression(site.iterator),
    }),
  __DEFAULT__: (node, context, site) =>
    visit(node, context, {
      ...PATTERN,
      kind: site.kind,
      right: makeApplyExpression(
        makeGetExpression(site.iterator, makeLiteralExpression("next")),
        site.iterator,
        [],
      ),
    }),
};
